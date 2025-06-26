import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaptionRequest {
  imageUri?: string;
  imageDescription?: string; // For when we have image analysis already
  contentType?: 'photo' | 'video';
  context?: any; // Additional context from the app
}

interface CaptionResponse {
  success: boolean;
  captions?: string[];
  error?: string;
  metadata?: {
    processingTime: number;
    similarContentCount: number;
    contextUsed: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔵 Starting caption generation function')
    
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

    console.log('🔵 Supabase client initialized')

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('🔵 User authenticated:', user.id)

    const startTime = Date.now()
    
    // Parse request body with error handling
    let requestData: CaptionRequest
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      throw new Error('Invalid request body')
    }
    
    const { imageUri, imageDescription, contentType = 'photo', context } = requestData

    console.log('🔵 Processing caption request for user:', user.id, 'contentType:', contentType)

    // Step 1: Get enhanced user context for personalization (with feedback integration)
    console.log('🔵 Fetching enhanced user context for RAG...')
    let userContext: any = null
    let preferences: any = {}
    let recentContent: any[] = []
    let feedbackPreferences: any = {}
    let analyticsData: any = {}
    
    try {
      const { data: contextData, error: contextError } = await supabaseClient
        .rpc('get_user_rag_context_enhanced', { user_id_param: user.id })

      if (contextError) {
        console.error('⚠️ Error getting enhanced user context (continuing without):', contextError)
        // Fallback to basic context
        const { data: basicContextData, error: basicContextError } = await supabaseClient
          .rpc('get_user_rag_context', { user_id_param: user.id })
        
        if (!basicContextError) {
          userContext = basicContextData
          preferences = userContext?.preferences || {}
          recentContent = userContext?.recent_content || []
        }
      } else {
        userContext = contextData
        preferences = userContext?.preferences || {}
        recentContent = userContext?.recent_content || []
        feedbackPreferences = userContext?.feedback_preferences || {}
        analyticsData = userContext?.analytics_summary || {}
        console.log('✅ Enhanced user context loaded successfully')
        console.log('🔵 Feedback integration status:', {
          has_liked_suggestions: feedbackPreferences?.liked_suggestions?.length > 0,
          has_editing_patterns: Object.keys(feedbackPreferences?.editing_patterns || {}).length > 0,
          recent_positive_rate: analyticsData?.recent_positive_rate || 0
        })
      }
    } catch (contextException) {
      console.error('⚠️ Exception getting enhanced user context (continuing without):', contextException)
      // Continue without context rather than failing
    }

    console.log('🔵 User preferences loaded:', {
      fitnessGoal: preferences.fitness_goal,
      contentStyle: preferences.content_style,
      dietaryRestrictions: preferences.dietary_restrictions,
      hasContext: !!userContext
    })

    // Step 2: Generate embedding for current content
    let queryEmbedding: number[] | null = null
    let imageAnalysis = imageDescription || ''

    // If no image or description provided, use a generic food description
    if (!imageUri && !imageDescription) {
      imageAnalysis = 'A healthy meal or food item'
      console.log('🔵 No image provided, using generic description')
    }

    // If we have an image, analyze it first
    if (imageUri && !imageDescription) {
      console.log('🔵 Analyzing image with OpenAI Vision...')
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // More cost-effective for image analysis
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this food/meal image. Describe what you see including: ingredients, cooking method, presentation style, portion size, and any nutritional aspects. Be concise but detailed.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageUri }
                  }
                ]
              }
            ],
            max_tokens: 200
          })
        })

        if (openaiResponse.ok) {
          const imageAnalysisResult = await openaiResponse.json()
          imageAnalysis = imageAnalysisResult.choices[0]?.message?.content || ''
          console.log('Image analysis completed:', imageAnalysis.substring(0, 100) + '...')
        }
      } catch (error) {
        console.error('Image analysis failed:', error)
        imageAnalysis = `A ${contentType} of food or a meal`
      }
    }

    // Generate embedding for the image analysis
    if (imageAnalysis) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: imageAnalysis
          })
        })

        if (embeddingResponse.ok) {
          const embeddingResult = await embeddingResponse.json()
          queryEmbedding = embeddingResult.data[0]?.embedding
          console.log('Embedding generated successfully')
        }
      } catch (error) {
        console.error('Embedding generation failed:', error)
      }
    }

    // Step 3: Search for similar content in user's history
    let similarContent: any[] = []
    if (queryEmbedding) {
      try {
        // Convert JavaScript array to PostgreSQL vector format
        const vectorString = `[${queryEmbedding.join(',')}]`
        
        const { data: similarResults, error: searchError } = await supabaseClient
          .rpc('search_similar_content', {
            query_embedding: vectorString,
            user_id_param: user.id,
            content_types: ['caption', 'image_metadata'],
            similarity_threshold: 0.6,
            max_results: 5
          })

        if (!searchError && similarResults) {
          similarContent = similarResults
          console.log(`Found ${similarContent.length} similar content pieces`)
        } else if (searchError) {
          console.error('Similar content search error:', searchError)
        }
      } catch (error) {
        console.error('Similar content search failed:', error)
      }
    }

    // Step 4: Build the prompt for caption generation with feedback integration
    const buildPersonalizedPrompt = () => {
      let prompt = `You are an AI assistant helping a health-conscious food enthusiast create engaging social media captions for their meal photos.

USER PROFILE:
- Primary fitness goal: ${preferences.fitness_goal || 'general health'}
- Content style preference: ${preferences.content_style || 'casual'}
- Dietary restrictions: ${preferences.dietary_restrictions?.join(', ') || 'none'}
- Activity level: ${preferences.activity_level || 'moderate'}
- Cooking skill: ${preferences.cooking_skill || 'intermediate'}

CURRENT CONTENT:
${imageAnalysis}

`

      // Add feedback-based learning (NEW)
      if (feedbackPreferences?.liked_suggestions?.length > 0) {
        const likedExamples = feedbackPreferences.liked_suggestions.slice(0, 3)
        prompt += `SUCCESSFUL SUGGESTIONS (user liked these):
${likedExamples.map((suggestion: string) => `- "${suggestion}"`).join('\n')}

`
      }

      if (feedbackPreferences?.disliked_suggestions?.length > 0) {
        const dislikedExamples = feedbackPreferences.disliked_suggestions.slice(0, 2)
        prompt += `AVOID THESE PATTERNS (user disliked these):
${dislikedExamples.map((suggestion: string) => `- "${suggestion}"`).join('\n')}

`
      }

      // Add editing patterns (NEW)
      if (feedbackPreferences?.editing_patterns && Object.keys(feedbackPreferences.editing_patterns).length > 0) {
        prompt += `USER EDITING PATTERNS:
`
        Object.entries(feedbackPreferences.editing_patterns).forEach(([type, data]: [string, any]) => {
          if (data.common_edits && data.common_edits.length > 0) {
            prompt += `- ${type} suggestions often edited to: "${data.common_edits[0]}"\n`
          }
        })
        prompt += '\n'
      }

      // Add context from similar content
      if (similarContent.length > 0) {
        prompt += `SIMILAR PAST CONTENT (for style reference):
${similarContent.map(item => `- "${item.content_text}" (similarity: ${(item.similarity * 100).toFixed(0)}%)`).join('\n')}

`
      }

      // Add recent content patterns
      if (recentContent.length > 0) {
        const recentCaptions = recentContent
          .filter((item: any) => item.caption)
          .slice(0, 3)
          .map((item: any) => item.caption)

        if (recentCaptions.length > 0) {
          prompt += `RECENT CAPTIONS (for consistency):
${recentCaptions.map((caption: string) => `- "${caption}"`).join('\n')}

`
        }
      }

      // Add performance feedback context (NEW)
      if (analyticsData?.recent_positive_rate > 0) {
        prompt += `PERFORMANCE NOTE: Your recent AI suggestions have a ${analyticsData.recent_positive_rate}% positive feedback rate. `
        if (analyticsData.recent_positive_rate >= 70) {
          prompt += `Keep using the current successful style patterns.\n\n`
        } else if (analyticsData.recent_positive_rate >= 50) {
          prompt += `Focus on what the user has liked before and avoid patterns they disliked.\n\n`
        } else {
          prompt += `Pay extra attention to the user's liked examples and editing patterns to improve.\n\n`
        }
      }

      prompt += `TASK:
Generate exactly 3 distinct caption options that:
1. Match the user's preferred ${preferences.content_style || 'casual'} tone
2. Align with their ${preferences.fitness_goal || 'health'} goals
3. Consider their dietary preferences: ${preferences.dietary_restrictions?.join(', ') || 'none'}
4. Are suitable for social media (engaging, not too long)
5. Include relevant hashtags if appropriate
6. ${feedbackPreferences?.liked_suggestions?.length > 0 ? 'Follow patterns from successful suggestions above' : 'Create engaging, personalized content'}
7. ${feedbackPreferences?.disliked_suggestions?.length > 0 ? 'Avoid patterns similar to disliked suggestions' : 'Focus on authenticity and value'}

Each caption should be different in approach:
- Option 1: Focus on the nutritional/health benefits
- Option 2: Emphasize the taste/enjoyment aspect  
- Option 3: Share a personal insight or tip

Format your response as a JSON array of exactly 3 strings. No additional text or explanation.`

      return prompt
    }

    // Step 5: Generate captions using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a specialized AI for creating personalized social media captions for food content. Always respond with valid JSON containing exactly 3 caption strings.'
          },
          {
            role: 'user',
            content: buildPersonalizedPrompt()
          }
        ],
        max_tokens: 800,
        temperature: 0.8, // Some creativity for varied captions
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const result = await openaiResponse.json()
    const captionText = result.choices[0]?.message?.content

    if (!captionText) {
      throw new Error('No caption generated')
    }

    // Parse the JSON response
    let captions: string[]
    try {
      const parsed = JSON.parse(captionText)
      // Handle different possible response formats
      if (Array.isArray(parsed)) {
        captions = parsed
      } else if (parsed.captions && Array.isArray(parsed.captions)) {
        captions = parsed.captions
      } else if (typeof parsed === 'object') {
        // Extract values from object
        captions = Object.values(parsed).filter(val => typeof val === 'string') as string[]
      } else {
        throw new Error('Invalid response format')
      }

      // Ensure we have exactly 3 captions
      if (captions.length < 3) {
        // Pad with variations if needed
        while (captions.length < 3) {
          captions.push(captions[0] + ' 🌟')
        }
      }
      captions = captions.slice(0, 3) // Take only first 3

    } catch (parseError) {
      console.error('Failed to parse caption JSON:', parseError)
      console.error('Raw response:', captionText)
      
      // Fallback: create basic captions
      captions = [
        `Fueling my ${preferences.fitness_goal || 'health'} journey with this delicious meal! 💪`,
        `This looks amazing and tastes even better! Perfect for my ${preferences.content_style || 'healthy'} lifestyle 😋`,
        `Made with love and mindful of my goals. What's your favorite healthy meal? 🥗`
      ]
    }

    const processingTime = Date.now() - startTime

    console.log(`Caption generation completed in ${processingTime}ms`)

    const response: CaptionResponse = {
      success: true,
      captions,
      metadata: {
        processingTime,
        similarContentCount: similarContent.length,
        contextUsed: !!userContext
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in generate-smart-captions:', error)
    
    // Ensure we always return a valid JSON response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const response: CaptionResponse = {
      success: false,
      error: errorMessage
    }

    console.log('🔴 Returning error response:', response)

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}) 