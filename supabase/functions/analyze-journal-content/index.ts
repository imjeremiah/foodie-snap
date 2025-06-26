import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  entryId: string;
  imageUri?: string;
  caption?: string;
  forceReanalyze?: boolean;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: {
    meal_type: string;
    dietary_pattern: string;
    nutrition_focus: string;
    cooking_method: string;
    meal_timing: string;
    estimated_calories: number;
    estimated_protein: number;
    estimated_carbs: number;
    estimated_fat: number;
    ingredients: string[];
    ai_generated_insights: string[];
    ai_analysis_confidence: number;
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
    console.log('🔵 Starting journal content analysis function')
    
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
    let requestData: AnalysisRequest
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      throw new Error('Invalid request body')
    }
    
    const { entryId, imageUri, caption, forceReanalyze = false } = requestData

    console.log('🔵 Processing content analysis for entry:', entryId)

    // Get journal entry data and user preferences
    const { data: entryData, error: entryError } = await supabaseClient
      .from('journal_entries')
      .select(`
        *,
        user:profiles!inner (
          primary_fitness_goal,
          dietary_restrictions,
          preferred_content_style,
          activity_level,
          cooking_skill_level
        )
      `)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entryData) {
      throw new Error('Journal entry not found or access denied')
    }

    // Check if analysis already exists and force reanalyze is false
    if (!forceReanalyze && entryData.last_analyzed_at && entryData.ai_analysis_confidence > 0.5) {
      console.log('⚡ Using existing analysis for entry:', entryId)
      const existingAnalysis = {
        meal_type: entryData.meal_type,
        dietary_pattern: entryData.dietary_pattern,
        nutrition_focus: entryData.nutrition_focus,
        cooking_method: entryData.cooking_method,
        meal_timing: entryData.meal_timing,
        estimated_calories: entryData.estimated_calories,
        estimated_protein: entryData.estimated_protein,
        estimated_carbs: entryData.estimated_carbs,
        estimated_fat: entryData.estimated_fat,
        ingredients: entryData.ingredients || [],
        ai_generated_insights: entryData.ai_generated_insights || [],
        ai_analysis_confidence: entryData.ai_analysis_confidence
      }
      
      return new Response(JSON.stringify({
        success: true,
        analysis: existingAnalysis,
        processingTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user context for personalized analysis
    const userProfile = entryData.user
    const contextualInfo = {
      fitness_goal: userProfile.primary_fitness_goal || 'general_health',
      dietary_restrictions: userProfile.dietary_restrictions || [],
      activity_level: userProfile.activity_level || 'moderate',
      cooking_skill: userProfile.cooking_skill_level || 'intermediate'
    }

    // Build analysis prompt
    const buildAnalysisPrompt = () => {
      const imageSource = imageUri || entryData.image_url
      const contentCaption = caption || entryData.caption || ''
      
      return `Analyze this food image and extract detailed metadata for nutrition tracking. 

USER CONTEXT:
- Fitness Goal: ${contextualInfo.fitness_goal}
- Dietary Restrictions: ${contextualInfo.dietary_restrictions.join(', ') || 'none'}
- Activity Level: ${contextualInfo.activity_level}
- Cooking Skill: ${contextualInfo.cooking_skill}

CONTENT TO ANALYZE:
- Caption: "${contentCaption}"
- Image: [Will be provided separately]

TASK:
Extract the following information and respond with VALID JSON only:

{
  "meal_type": "breakfast|lunch|dinner|snack|dessert|beverage|meal_prep|other",
  "dietary_pattern": "high_protein|low_carb|keto|vegan|vegetarian|paleo|mediterranean|balanced|other",
  "nutrition_focus": "muscle_building|fat_loss|energy_boost|recovery|general_health|performance|comfort|other",
  "cooking_method": "grilled|baked|fried|steamed|boiled|raw|sauteed|roasted|air_fried|slow_cooked|other",
  "meal_timing": "pre_workout|post_workout|morning|afternoon|evening|late_night|between_meals|other",
  "estimated_calories": 400,
  "estimated_protein": 25.5,
  "estimated_carbs": 45.0,
  "estimated_fat": 15.0,
  "ingredients": ["chicken breast", "brown rice", "broccoli", "olive oil"],
  "ai_generated_insights": [
    "This meal provides excellent protein for muscle recovery",
    "Great balance of macronutrients for your ${contextualInfo.fitness_goal} goal",
    "The cooking method preserves nutrients well"
  ],
  "ai_analysis_confidence": 0.85
}

GUIDELINES:
- Base estimates on visual analysis and typical portions
- Generate 2-3 personalized insights based on user's fitness goal
- Set confidence between 0.1-1.0 based on image clarity and information available
- Include 3-8 main ingredients visible in the image
- Choose the most specific categories that apply`
    }

    // Analyze with OpenAI Vision API
    console.log('🔵 Analyzing content with OpenAI Vision...')
    
    const imageToAnalyze = imageUri || entryData.image_url
    if (!imageToAnalyze) {
      throw new Error('No image available for analysis')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model with vision
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert analyzing food images for meal tracking. Always respond with valid JSON containing the exact structure requested.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: buildAnalysisPrompt()
              },
              {
                type: 'image_url',
                image_url: { url: imageToAnalyze }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const analysisResult = await openaiResponse.json()
    const responseText = analysisResult.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No analysis returned from OpenAI')
    }

    console.log('✅ Analysis received, parsing results...')

    // Parse analysis result
    let analysis: any
    try {
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      console.error('⚠️ Error parsing analysis JSON:', parseError)
      console.error('Raw response:', responseText)
      
      // Fallback analysis based on user context
      analysis = {
        meal_type: 'other',
        dietary_pattern: contextualInfo.dietary_restrictions.includes('vegan') ? 'vegan' : 
                        contextualInfo.dietary_restrictions.includes('vegetarian') ? 'vegetarian' : 'balanced',
        nutrition_focus: contextualInfo.fitness_goal === 'muscle_gain' ? 'muscle_building' : 
                        contextualInfo.fitness_goal === 'fat_loss' ? 'fat_loss' : 'general_health',
        cooking_method: 'other',
        meal_timing: 'other',
        estimated_calories: 400,
        estimated_protein: 20,
        estimated_carbs: 30,
        estimated_fat: 15,
        ingredients: ['mixed ingredients'],
        ai_generated_insights: [
          'This meal appears to support your fitness goals',
          `Great choice for your ${contextualInfo.fitness_goal} journey`
        ],
        ai_analysis_confidence: 0.6
      }
    }

    // Update journal entry with analysis
    console.log('🔵 Updating journal entry with analysis...')
    
    const { error: updateError } = await supabaseClient
      .from('journal_entries')
      .update({
        meal_type: analysis.meal_type,
        dietary_pattern: analysis.dietary_pattern,
        nutrition_focus: analysis.nutrition_focus,
        cooking_method: analysis.cooking_method,
        meal_timing: analysis.meal_timing,
        estimated_calories: analysis.estimated_calories,
        estimated_protein: analysis.estimated_protein,
        estimated_carbs: analysis.estimated_carbs,
        estimated_fat: analysis.estimated_fat,
        ingredients: analysis.ingredients,
        ai_generated_insights: analysis.ai_generated_insights,
        ai_analysis_confidence: analysis.ai_analysis_confidence,
        last_analyzed_at: new Date().toISOString(),
        semantic_embedding_generated: false, // Mark for embedding generation
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('⚠️ Failed to update journal entry:', updateError)
      // Don't fail the entire operation, just log the error
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Content analysis completed in ${processingTime}ms`)

    const response: AnalysisResponse = {
      success: true,
      analysis,
      processingTime
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in analyze-journal-content:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const response: AnalysisResponse = {
      success: false,
      error: errorMessage
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}) 