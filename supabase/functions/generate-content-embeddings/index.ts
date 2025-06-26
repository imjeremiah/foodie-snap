import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  journalEntryId: string;
  imageUri?: string;
  caption?: string;
  forceRegenerate?: boolean;
}

interface EmbeddingResponse {
  success: boolean;
  embeddingsGenerated?: number;
  error?: string;
  processingTime?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for background processing
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const startTime = Date.now()
    const { journalEntryId, imageUri, caption, forceRegenerate = false }: EmbeddingRequest = await req.json()

    console.log('Processing embedding generation for journal entry:', journalEntryId)

    // Get the journal entry details
    const { data: journalEntry, error: entryError } = await supabaseClient
      .from('journal_entries')
      .select('*')
      .eq('id', journalEntryId)
      .single()

    if (entryError || !journalEntry) {
      throw new Error(`Journal entry not found: ${entryError?.message}`)
    }

    const userId = journalEntry.user_id
    let embeddingsGenerated = 0

    // Check if embeddings already exist (unless force regenerate)
    if (!forceRegenerate) {
      const { data: existingEmbeddings } = await supabaseClient
        .from('content_embeddings')
        .select('id')
        .eq('journal_entry_id', journalEntryId)

      if (existingEmbeddings && existingEmbeddings.length > 0) {
        console.log('Embeddings already exist for journal entry:', journalEntryId)
        return new Response(JSON.stringify({
          success: true,
          embeddingsGenerated: 0,
          processingTime: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Generate embeddings for different content types
    const embeddingTasks: Promise<any>[] = []

    // 1. Generate embedding for caption if it exists
    if (caption || journalEntry.caption) {
      const captionText = caption || journalEntry.caption
      embeddingTasks.push(
        generateAndStoreEmbedding(
          supabaseClient,
          userId,
          journalEntryId,
          'caption',
          captionText,
          { source: 'user_caption' }
        )
      )
    }

    // 2. Generate embedding for image analysis if we have an image
    if (imageUri || journalEntry.image_url) {
      const imageUrl = imageUri || journalEntry.image_url
      embeddingTasks.push(
        generateImageEmbedding(
          supabaseClient,
          userId,
          journalEntryId,
          imageUrl,
          journalEntry.content_type
        )
      )
    }

    // 3. Generate embedding for tags/metadata if available
    if (journalEntry.tags && journalEntry.tags.length > 0) {
      const tagsText = journalEntry.tags.join(', ')
      embeddingTasks.push(
        generateAndStoreEmbedding(
          supabaseClient,
          userId,
          journalEntryId,
          'image_metadata',
          `Tags: ${tagsText}`,
          { tags: journalEntry.tags, source: 'user_tags' }
        )
      )
    }

    // Execute all embedding generation tasks
    const results = await Promise.allSettled(embeddingTasks)
    
    // Count successful embeddings
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        embeddingsGenerated++
        console.log(`Embedding task ${index + 1} completed successfully`)
      } else {
        console.error(`Embedding task ${index + 1} failed:`, result.reason)
      }
    })

    const processingTime = Date.now() - startTime
    console.log(`Embedding generation completed. Generated ${embeddingsGenerated} embeddings in ${processingTime}ms`)

    const response: EmbeddingResponse = {
      success: true,
      embeddingsGenerated,
      processingTime
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in generate-content-embeddings:', error)
    
    const response: EmbeddingResponse = {
      success: false,
      error: error.message
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Generate embedding for text content and store it
 */
async function generateAndStoreEmbedding(
  supabaseClient: any,
  userId: string,
  journalEntryId: string,
  contentType: string,
  contentText: string,
  metadata: any = {}
): Promise<void> {
  try {
    // Generate embedding using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: contentText
      })
    })

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI embedding API error: ${embeddingResponse.status}`)
    }

    const embeddingResult = await embeddingResponse.json()
    const embedding = embeddingResult.data[0]?.embedding

    if (!embedding) {
      throw new Error('No embedding returned from OpenAI')
    }

    // Store embedding in database (convert array to PostgreSQL vector format)
    const vectorString = `[${embedding.join(',')}]`
    const { error: insertError } = await supabaseClient
      .from('content_embeddings')
      .upsert({
        user_id: userId,
        journal_entry_id: journalEntryId,
        content_type: contentType,
        content_text: contentText,
        embedding: vectorString,
        metadata: metadata
      })

    if (insertError) {
      throw new Error(`Database insert error: ${insertError.message}`)
    }

    console.log(`Stored ${contentType} embedding for journal entry ${journalEntryId}`)

  } catch (error) {
    console.error(`Failed to generate embedding for ${contentType}:`, error)
    throw error
  }
}

/**
 * Analyze image and generate embedding for the analysis
 */
async function generateImageEmbedding(
  supabaseClient: any,
  userId: string,
  journalEntryId: string,
  imageUrl: string,
  contentType: string
): Promise<void> {
  try {
    // First, analyze the image using OpenAI Vision
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food/meal image for content indexing. Describe: ingredients visible, cooking methods used, cuisine type, presentation style, nutritional aspects, portion size, and meal type (breakfast/lunch/dinner/snack). Be detailed but concise.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    })

    if (!analysisResponse.ok) {
      throw new Error(`OpenAI vision API error: ${analysisResponse.status}`)
    }

    const analysisResult = await analysisResponse.json()
    const imageAnalysis = analysisResult.choices[0]?.message?.content

    if (!imageAnalysis) {
      throw new Error('No image analysis returned from OpenAI')
    }

    console.log('Image analysis completed:', imageAnalysis.substring(0, 100) + '...')

    // Generate embedding for the image analysis
    await generateAndStoreEmbedding(
      supabaseClient,
      userId,
      journalEntryId,
      'image_metadata',
      imageAnalysis,
      { 
        source: 'ai_image_analysis', 
        content_type: contentType,
        analysis_model: 'gpt-4o-mini'
      }
    )

  } catch (error) {
    console.error('Failed to generate image embedding:', error)
    throw error
  }
} 