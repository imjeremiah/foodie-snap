-- Setup pgvector extension and embeddings for RAG caption generation
-- Phase 3, Step 2: Smart Caption Engine with RAG Pipeline

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing content embeddings
CREATE TABLE IF NOT EXISTS public.content_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('caption', 'image_metadata', 'nutrition_data')),
  content_text TEXT NOT NULL, -- The original text that was embedded
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}', -- Additional context like meal_type, ingredients, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we don't duplicate embeddings for the same content
  UNIQUE(journal_entry_id, content_type)
);

-- Create index for vector similarity search using HNSW
CREATE INDEX IF NOT EXISTS content_embeddings_embedding_idx 
ON public.content_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS content_embeddings_user_id_idx ON public.content_embeddings(user_id);
CREATE INDEX IF NOT EXISTS content_embeddings_content_type_idx ON public.content_embeddings(content_type);
CREATE INDEX IF NOT EXISTS content_embeddings_created_at_idx ON public.content_embeddings(created_at DESC);

-- Create AI feedback table for tracking caption generation feedback
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('caption', 'nutrition', 'recipe', 'prompt')),
  suggestion_id TEXT NOT NULL, -- Unique identifier for the suggestion
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'edited', 'ignored')),
  original_suggestion TEXT NOT NULL,
  edited_version TEXT, -- If user edited the suggestion
  context_metadata JSONB DEFAULT '{}', -- Context when suggestion was made
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI feedback
CREATE INDEX IF NOT EXISTS ai_feedback_user_id_idx ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS ai_feedback_suggestion_type_idx ON public.ai_feedback(suggestion_type);
CREATE INDEX IF NOT EXISTS ai_feedback_created_at_idx ON public.ai_feedback(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_embeddings
CREATE POLICY "Users can view their own embeddings" ON public.content_embeddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings" ON public.content_embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings" ON public.content_embeddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings" ON public.content_embeddings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_feedback
CREATE POLICY "Users can view their own AI feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to search similar content for RAG context
CREATE OR REPLACE FUNCTION search_similar_content(
  query_embedding vector(1536),
  user_id_param UUID,
  content_types TEXT[] DEFAULT ARRAY['caption', 'image_metadata'],
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  journal_entry_id UUID,
  content_text TEXT,
  content_type TEXT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.journal_entry_id,
    ce.content_text,
    ce.content_type,
    ce.metadata,
    (1 - (ce.embedding <=> query_embedding)) as similarity,
    ce.created_at
  FROM public.content_embeddings ce
  WHERE ce.user_id = user_id_param
    AND ce.content_type = ANY(content_types)
    AND (1 - (ce.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Function to get user context for RAG (combining preferences and recent content)
CREATE OR REPLACE FUNCTION get_user_rag_context(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB 
LANGUAGE plpgsql
AS $$
DECLARE
  user_preferences JSONB;
  recent_content JSONB;
  result JSONB;
BEGIN
  -- Get user preferences
  SELECT get_user_preferences_for_rag(user_id_param) INTO user_preferences;
  
  -- Get recent journal entries for context
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'caption', je.caption,
        'content_type', je.content_type,
        'tags', je.tags,
        'created_at', je.created_at
      ) ORDER BY je.created_at DESC
    ), 
    '[]'::json
  ) INTO recent_content
  FROM public.journal_entries je
  WHERE je.user_id = user_id_param
    AND je.created_at > NOW() - INTERVAL '30 days'
  LIMIT 20;
  
  -- Combine preferences and recent content
  result := json_build_object(
    'preferences', user_preferences,
    'recent_content', recent_content,
    'context_generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- Function to store AI feedback
CREATE OR REPLACE FUNCTION store_ai_feedback(
  suggestion_type_param TEXT,
  suggestion_id_param TEXT,
  feedback_type_param TEXT,
  original_suggestion_param TEXT,
  edited_version_param TEXT DEFAULT NULL,
  context_metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  feedback_id UUID;
  user_id_param UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO user_id_param;
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;
  
  -- Insert feedback
  INSERT INTO public.ai_feedback (
    user_id,
    suggestion_type,
    suggestion_id,
    feedback_type,
    original_suggestion,
    edited_version,
    context_metadata
  ) VALUES (
    user_id_param,
    suggestion_type_param,
    suggestion_id_param,
    feedback_type_param,
    original_suggestion_param,
    edited_version_param,
    context_metadata_param
  ) RETURNING id INTO feedback_id;
  
  RETURN feedback_id;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.content_embeddings TO authenticated;
GRANT ALL ON public.ai_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_content(vector, UUID, TEXT[], FLOAT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rag_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION store_ai_feedback(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Add trigger for updated_at on content_embeddings
CREATE TRIGGER update_content_embeddings_updated_at 
  BEFORE UPDATE ON public.content_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 