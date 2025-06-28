import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentSparkRequest {
  userId?: string; // For manual testing, normally comes from cron
  generateForAllUsers?: boolean; // For cron job
}

interface ContentSparkResponse {
  success: boolean;
  sparksGenerated?: number;
  error?: string;
  processingTime?: number;
}

interface PromptData {
  title: string;
  description: string;
  type: 'photo' | 'video';
  category: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  estimated_time: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔵 Starting weekly content spark generation')
    
    // Initialize Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user first
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('❌ User authentication failed:', authError)
      throw new Error('Unauthorized - please sign in again')
    }

    console.log('✅ User authenticated:', user.id)

    // Initialize service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = Date.now()
    let requestData: ContentSparkRequest = {}
    
    try {
      requestData = await req.json()
    } catch {
      // No body provided, default to generating for all users (cron mode)
      requestData = { generateForAllUsers: true }
    }

    const { userId, generateForAllUsers = false } = requestData

    let usersToProcess: any[] = []

    if (userId) {
      // Manual generation for specific user - validate it matches authenticated user
      if (userId !== user.id) {
        throw new Error('Can only generate content sparks for yourself')
      }

      const { data: userProfile, error: userError } = await serviceClient
        .from('profiles')
        .select(`
          id, email, display_name, content_spark_notifications,
          primary_fitness_goal, dietary_restrictions, preferred_content_style,
          cooking_skill_level, activity_level, onboarding_completed
        `)
        .eq('id', userId)
        .single()

      if (userError || !userProfile) {
        throw new Error(`User profile not found: ${userError?.message}`)
      }

      usersToProcess = [userProfile]
    } else if (generateForAllUsers) {
      // Get all users who need content sparks this week (admin only)
      const { data: users, error: usersError } = await serviceClient
        .rpc('get_users_needing_content_sparks')

      if (usersError) {
        throw new Error(`Failed to get users: ${usersError.message}`)
      }

      usersToProcess = users || []
      console.log(`Found ${usersToProcess.length} users needing content sparks`)
    } else {
      // Default: generate for current authenticated user
      const { data: userProfile, error: userError } = await serviceClient
        .from('profiles')
        .select(`
          id, email, display_name, content_spark_notifications,
          primary_fitness_goal, dietary_restrictions, preferred_content_style,
          cooking_skill_level, activity_level, onboarding_completed
        `)
        .eq('id', user.id)
        .single()

      if (userError || !userProfile) {
        throw new Error(`User profile not found: ${userError?.message}`)
      }

      usersToProcess = [userProfile]
    }

    let sparksGenerated = 0

    // Process each user
    for (const user of usersToProcess) {
      try {
        console.log(`Generating content spark for user: ${user.email}`)
        
        // Generate personalized prompts for this user
        const prompts = await generatePersonalizedPrompts(serviceClient, user)
        
        // Get current week identifier
        const { data: weekId, error: weekError } = await serviceClient
          .rpc('get_current_week_identifier')

        if (weekError || !weekId) {
          throw new Error(`Failed to get week identifier: ${weekError?.message}`)
        }

        // Store content spark in database
        console.log(`🔵 Storing content spark for user ID: ${user.id}`);
        const { data: insertedData, error: insertError } = await serviceClient
          .from('content_sparks')
          .upsert({
            user_id: user.id, // Use consistent user.id field
            week_identifier: weekId,
            prompts: prompts,
            generation_context: {
              user_preferences: {
                fitness_goal: user.primary_fitness_goal,
                content_style: user.preferred_content_style,
                dietary_restrictions: user.dietary_restrictions
              },
              generated_at: new Date().toISOString(),
              model_used: 'gpt-4o-mini'
            }
          })
          .select()

        if (insertError) {
          console.error(`❌ Failed to store content spark for user ${user.email}:`, insertError)
          continue
        }

        console.log(`✅ Content spark stored successfully:`, insertedData);

        // Send push notification (simplified for now)
        await sendContentSparkNotification(user)
        
        sparksGenerated++
        console.log(`✅ Content spark generated for ${user.email}`)

      } catch (userError) {
        console.error(`Failed to generate content spark for user ${user.email}:`, userError)
        // Continue processing other users
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Content spark generation completed. Generated ${sparksGenerated} sparks in ${processingTime}ms`)

    const response: ContentSparkResponse = {
      success: true,
      sparksGenerated,
      processingTime
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in generate-weekly-content-sparks:', error)
    
    const response: ContentSparkResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Generate 3 personalized content prompts for a user using RAG and preferences
 */
async function generatePersonalizedPrompts(serviceClient: any, user: any): Promise<PromptData[]> {
  console.log(`🔵 Generating prompts for user with preferences:`, {
    fitness_goal: user.primary_fitness_goal,
    content_style: user.preferred_content_style,
    dietary_restrictions: user.dietary_restrictions
  })

  // Get user's recent content for context
  const { data: recentContent } = await serviceClient
    .from('journal_entries')
    .select('caption, tags, content_type, created_at')
    .eq('user_id', user.id) // Use consistent user.id field
    .order('created_at', { ascending: false })
    .limit(10)

  // Get user's AI feedback patterns for personalization
  const { data: feedbackData } = await serviceClient
    .from('ai_feedback')
    .select('suggestion_type, feedback_type, original_suggestion, context_metadata')
    .eq('user_id', user.id) // Use consistent user.id field
    .eq('feedback_type', 'thumbs_up')
    .order('created_at', { ascending: false })
    .limit(5)

  // Build comprehensive prompt for OpenAI
  const systemPrompt = buildContentSparkPrompt(user, recentContent, feedbackData)

  console.log('🔵 Calling OpenAI for prompt generation...')

  // Call OpenAI to generate personalized prompts
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
          content: 'You are an expert content strategist specializing in health and fitness social media. Generate personalized, engaging content prompts that inspire users to create authentic content about their health journey.'
        },
        {
          role: 'user',
          content: systemPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8, // More creative for varied prompts
      response_format: { type: 'json_object' }
    })
  })

  if (!openaiResponse.ok) {
    const error = await openaiResponse.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const result = await openaiResponse.json()
  const promptsText = result.choices[0]?.message?.content

  if (!promptsText) {
    throw new Error('No prompts generated by OpenAI')
  }

  // Parse the JSON response
  let parsedPrompts: any
  try {
    parsedPrompts = JSON.parse(promptsText)
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError)
    console.error('Raw response:', promptsText)
    
    // Fallback to generic prompts
    return getGenericPrompts(user)
  }

  // Validate and format prompts
  const prompts = parsedPrompts.prompts || []
  if (!Array.isArray(prompts) || prompts.length < 3) {
    console.error('Invalid prompts format, using fallback')
    return getGenericPrompts(user)
  }

  console.log('✅ Generated personalized prompts:', prompts.slice(0, 3))
  return prompts.slice(0, 3)
}

/**
 * Build comprehensive prompt for OpenAI based on user context
 */
function buildContentSparkPrompt(user: any, recentContent: any[], feedbackData: any[]): string {
  const fitnessGoal = user.primary_fitness_goal || 'general health'
  const contentStyle = user.preferred_content_style || 'casual'
  const dietaryRestrictions = user.dietary_restrictions || []
  const cookingSkill = user.cooking_skill_level || 'intermediate'
  const activityLevel = user.activity_level || 'moderately_active'

  let prompt = `Generate 3 personalized weekly content prompts for a health-conscious user.

USER PROFILE:
- Primary fitness goal: ${fitnessGoal}
- Preferred content style: ${contentStyle}
- Dietary restrictions: ${dietaryRestrictions.join(', ') || 'none'}
- Cooking skill level: ${cookingSkill}
- Activity level: ${activityLevel}

`

  // Add recent content context
  if (recentContent && recentContent.length > 0) {
    const recentCaptions = recentContent
      .filter(item => item.caption)
      .slice(0, 3)
      .map(item => item.caption)

    if (recentCaptions.length > 0) {
      prompt += `RECENT CONTENT PATTERNS:
${recentCaptions.map(caption => `- "${caption}"`).join('\n')}

`
    }
  }

  // Add successful feedback patterns
  if (feedbackData && feedbackData.length > 0) {
    const likedSuggestions = feedbackData
      .slice(0, 3)
      .map(item => item.original_suggestion)

    prompt += `SUCCESSFUL CONTENT STYLES (user liked these):
${likedSuggestions.map(suggestion => `- "${suggestion}"`).join('\n')}

`
  }

  prompt += `REQUIREMENTS:
1. Create exactly 3 distinct prompts
2. Mix of photo and video content types
3. Match the user's ${contentStyle} style preference
4. Align with their ${fitnessGoal} goal
5. Consider their ${cookingSkill} cooking skill level
6. Include variety: one easy, one medium, one more advanced/creative
7. Make prompts inspiring and actionable
8. Focus on authentic, personal content rather than generic poses

Format as JSON with this exact structure:
{
  "prompts": [
    {
      "title": "Short, catchy title",
      "description": "Detailed, inspiring description of what to create",
      "type": "photo" or "video",
      "category": "meal_prep" | "workout" | "nutrition" | "lifestyle" | "recipe",
      "difficulty": "easy" | "medium" | "advanced",
      "estimated_time": "5 minutes" | "10 minutes" | "15 minutes"
    }
  ]
}

Example good prompts:
- "Show us your protein-packed breakfast that keeps you energized all morning!"
- "Create a quick video of your 5-minute meal prep hack that saves you time during busy weekdays"
- "Share a photo of your favorite post-workout snack and tell us why it's perfect for recovery"

Generate prompts that feel personal and achievable for this specific user.`

  return prompt
}

/**
 * Get generic fallback prompts if AI generation fails
 */
function getGenericPrompts(user: any): PromptData[] {
  const goal = user.primary_fitness_goal || 'general health'
  
  return [
    {
      title: "Breakfast Power-Up",
      description: `Share a photo of your go-to healthy breakfast that supports your ${goal} goal. What makes this meal special for your fitness journey?`,
      type: 'photo',
      category: 'nutrition',
      difficulty: 'easy',
      estimated_time: '5 minutes'
    },
    {
      title: "Quick Meal Prep Tip",
      description: "Create a short video showing one meal prep hack that saves you time during busy weeks. Keep it simple and practical!",
      type: 'video',
      category: 'meal_prep',
      difficulty: 'medium',
      estimated_time: '10 minutes'
    },
    {
      title: "Healthy Lifestyle Moment",
      description: "Capture a photo that represents your healthy lifestyle today - whether it's your workout setup, a nutritious snack, or a moment of self-care.",
      type: 'photo',
      category: 'lifestyle',
      difficulty: 'easy',
      estimated_time: '5 minutes'
    }
  ]
}

/**
 * Send push notification for new content spark (simplified implementation)
 */
async function sendContentSparkNotification(user: any): Promise<void> {
  // Note: In a real implementation, you would integrate with a push notification service
  // like Firebase Cloud Messaging, Apple Push Notification Service, etc.
  
  console.log(`📱 Would send notification to ${user.email}: "Your weekly Content Spark is here! 🔥"`)
  
  // For now, we'll just log the notification
  // In production, you would:
  // 1. Get user's device tokens from your user preferences
  // 2. Send push notification via your preferred service
  // 3. Handle notification delivery status
  
  return Promise.resolve()
} 