import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanRequest {
  imageUri: string;
  context?: {
    scanType: 'ingredient' | 'nutrition_label' | 'food_item';
    userPreferences?: any;
  };
}

interface NutritionResponse {
  success: boolean;
  nutritionCard?: {
    foodName: string;
    nutritionFacts: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
    healthInsights: string[];
    recipeIdeas: string[];
    confidence: number;
    aiAnalysis: string;
  };
  error?: string;
  processingTime?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔵 Starting nutrition scan function')
    
    // Validate environment variables
    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_ANON_KEY') || !Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('Missing required environment variables')
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('🔵 User authenticated:', user.id)

    const startTime = Date.now()
    
    // Parse request body
    let requestData: ScanRequest
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      throw new Error('Invalid request body')
    }
    
    const { imageUri, context } = requestData
    const scanType = context?.scanType || 'food_item'

    console.log('🔵 Processing nutrition scan for user:', user.id, 'scanType:', scanType)

    // Step 1: Get user preferences for personalization
    console.log('🔵 Fetching user preferences...')
    let userPreferences: any = {}
    
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select(`
          primary_fitness_goal,
          dietary_restrictions,
          allergies,
          preferred_content_style,
          activity_level,
          daily_calorie_goal,
          protein_goal_grams
        `)
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        userPreferences = profile
        console.log('✅ User preferences loaded')
      }
    } catch (contextException) {
      console.error('⚠️ Error getting user preferences (continuing without):', contextException)
    }

    // Step 2: Single optimized OpenAI call for complete analysis
    console.log('🔵 Analyzing image and generating insights with OpenAI...')
    
    const completeAnalysisPrompt = getCompleteAnalysisPrompt(scanType, userPreferences)
    
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are an expert nutrition assistant. Analyze food images and provide comprehensive nutrition information in JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: completeAnalysisPrompt
              },
              {
                type: 'image_url',
                image_url: { url: imageUri }
              }
            ]
          }
        ],
        max_tokens: 1200, // Increased for complete response
        temperature: 0.4, // Balanced for accuracy and creativity
        response_format: { type: 'json_object' }
      })
    })

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text()
      throw new Error(`OpenAI Vision API error: ${error}`)
    }

    const analysisResult = await analysisResponse.json()
    const responseText = analysisResult.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No analysis returned from OpenAI')
    }

    console.log('✅ Complete analysis received, parsing results...')

    // Step 3: Parse complete response
    let completeAnalysis: any = {}
    try {
      completeAnalysis = JSON.parse(responseText)
    } catch (parseError) {
      console.error('⚠️ Error parsing complete analysis JSON:', parseError)
      console.error('Raw response:', responseText)
      
      // Fallback parsing for non-JSON responses
      completeAnalysis = {
        foodName: extractFoodName(responseText),
        nutritionFacts: parseNutritionAnalysis(responseText),
        healthInsights: ['This food item contains various nutrients that can support your health goals.'],
        recipeIdeas: ['Try incorporating this ingredient into your regular meal rotation.'],
        confidence: 0.7
      }
    }

    // Step 4: Build nutrition card response from complete analysis
    const nutritionCard = {
      foodName: completeAnalysis.foodName || extractFoodName(responseText),
      nutritionFacts: {
        calories: completeAnalysis.nutritionFacts?.calories || 0,
        protein: completeAnalysis.nutritionFacts?.protein || 0,
        carbs: completeAnalysis.nutritionFacts?.carbs || 0,
        fat: completeAnalysis.nutritionFacts?.fat || 0,
        fiber: completeAnalysis.nutritionFacts?.fiber,
        sugar: completeAnalysis.nutritionFacts?.sugar,
        sodium: completeAnalysis.nutritionFacts?.sodium
      },
      healthInsights: completeAnalysis.healthInsights || [],
      recipeIdeas: completeAnalysis.recipeIdeas || [],
      confidence: completeAnalysis.confidence || 0.8,
      aiAnalysis: responseText
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Nutrition scan completed in ${processingTime}ms`)

    const response: NutritionResponse = {
      success: true,
      nutritionCard,
      processingTime
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in scan-nutrition-label:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const response: NutritionResponse = {
      success: false,
      error: errorMessage
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Get complete analysis prompt that combines nutrition facts, insights, and recipes in one call
 */
function getCompleteAnalysisPrompt(scanType: string, userPreferences: any): string {
  const scanTypeText = scanType.replace('_', ' ')
  
  let specificInstructions = ''
  switch (scanType) {
    case 'nutrition_label':
      specificInstructions = 'Extract exact nutrition facts from the nutrition label, including calories, protein, carbs, fat, fiber, sugar, and sodium.'
      break
    case 'ingredient':
      specificInstructions = 'Identify the ingredient(s) and provide typical nutritional values, uses, and benefits.'
      break
    default: // food_item
      specificInstructions = 'Analyze this food item, identify its main components, and estimate nutritional values.'
  }

  let userContext = ''
  if (userPreferences.primary_fitness_goal) {
    userContext += `• Fitness Goal: ${userPreferences.primary_fitness_goal}\n`
  }
  if (userPreferences.dietary_restrictions?.length > 0) {
    userContext += `• Dietary Restrictions: ${userPreferences.dietary_restrictions.join(', ')}\n`
  }
  if (userPreferences.allergies?.length > 0) {
    userContext += `• Allergies: ${userPreferences.allergies.join(', ')}\n`
  }
  if (userPreferences.activity_level) {
    userContext += `• Activity Level: ${userPreferences.activity_level}\n`
  }

  return `Analyze this ${scanTypeText} image and provide a complete nutrition analysis in JSON format. ${specificInstructions}

${userContext ? `USER PROFILE:\n${userContext}` : ''}

Respond with this EXACT JSON structure:
{
  "foodName": "Descriptive name of the food item",
  "nutritionFacts": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium": 0
  },
  "healthInsights": [
    "3-4 personalized health insights based on user's goals and preferences",
    "Make them encouraging and specific to their fitness goals",
    "Consider their dietary restrictions and activity level",
    "Focus on how this food fits into their lifestyle"
  ],
  "recipeIdeas": [
    "3-4 recipe suggestions that align with their preferences",
    "Consider their dietary restrictions and fitness goals",
    "Provide creative ways to use this ingredient/food",
    "Make suggestions practical and appealing"
  ],
  "confidence": 0.8
}

Be accurate with nutrition facts, encouraging with insights, and creative with recipe ideas. Keep insights and recipes concise but valuable.`
}

/**
 * Parse nutrition analysis to extract structured data
 */
function parseNutritionAnalysis(analysis: string): any {
  const nutritionData: any = { confidence: 0.7 }
  
  // Extract calories
  const caloriesMatch = analysis.match(/(\d+)\s*(?:calories|kcal)/i)
  if (caloriesMatch) {
    nutritionData.calories = parseInt(caloriesMatch[1])
  }
  
  // Extract protein
  const proteinMatch = analysis.match(/(\d+(?:\.\d+)?)\s*g?\s*protein/i)
  if (proteinMatch) {
    nutritionData.protein = parseFloat(proteinMatch[1])
  }
  
  // Extract carbs
  const carbsMatch = analysis.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:carb|carbohydrate)/i)
  if (carbsMatch) {
    nutritionData.carbs = parseFloat(carbsMatch[1])
  }
  
  // Extract fat
  const fatMatch = analysis.match(/(\d+(?:\.\d+)?)\s*g?\s*fat/i)
  if (fatMatch) {
    nutritionData.fat = parseFloat(fatMatch[1])
  }
  
  // Extract fiber
  const fiberMatch = analysis.match(/(\d+(?:\.\d+)?)\s*g?\s*fiber/i)
  if (fiberMatch) {
    nutritionData.fiber = parseFloat(fiberMatch[1])
  }
  
  // Extract sugar
  const sugarMatch = analysis.match(/(\d+(?:\.\d+)?)\s*g?\s*sugar/i)
  if (sugarMatch) {
    nutritionData.sugar = parseFloat(sugarMatch[1])
  }
  
  // Extract sodium
  const sodiumMatch = analysis.match(/(\d+(?:\.\d+)?)\s*(?:mg)?\s*sodium/i)
  if (sodiumMatch) {
    nutritionData.sodium = parseFloat(sodiumMatch[1])
  }
  
  return nutritionData
}

/**
 * Extract food name from analysis
 */
function extractFoodName(analysis: string): string {
  // Try to extract food name from the beginning of the analysis
  const sentences = analysis.split('.')
  const firstSentence = sentences[0]
  
  // Look for patterns like "This is a..." or "The image shows..."
  const nameMatch = firstSentence.match(/(?:this is (?:a|an)?|image shows?|appears to be)\s*(.+)/i)
  if (nameMatch) {
    return nameMatch[1].trim()
  }
  
  // Fallback to first few words
  const words = firstSentence.split(' ')
  return words.slice(0, 3).join(' ')
} 