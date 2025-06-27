-- Migration for Content Sparks System (User Story #2)
-- Weekly personalized content prompt generation and delivery

-- Create content_sparks table
CREATE TABLE IF NOT EXISTS public.content_sparks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_identifier TEXT NOT NULL, -- e.g., "2025-01" for week 1 of 2025
  prompts JSONB NOT NULL, -- Array of 3 personalized prompts
  generation_context JSONB DEFAULT '{}', -- Metadata about how prompts were generated
  viewed_at TIMESTAMP WITH TIME ZONE, -- When user opened the content spark
  prompts_used INTEGER[] DEFAULT '{}', -- Which prompts (by index) the user acted on
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one content spark per user per week
  UNIQUE(user_id, week_identifier)
);

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS content_spark_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS content_spark_day INTEGER DEFAULT 1, -- 1 = Monday, 7 = Sunday
ADD COLUMN IF NOT EXISTS content_spark_time TIME DEFAULT '09:00:00';

-- Enable RLS
ALTER TABLE public.content_sparks ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_sparks
CREATE POLICY "Users can view their own content sparks" ON public.content_sparks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content sparks" ON public.content_sparks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS content_sparks_user_id_idx ON public.content_sparks(user_id);
CREATE INDEX IF NOT EXISTS content_sparks_week_idx ON public.content_sparks(week_identifier);
CREATE INDEX IF NOT EXISTS content_sparks_created_at_idx ON public.content_sparks(created_at DESC);

-- Function to get current week identifier
CREATE OR REPLACE FUNCTION get_current_week_identifier()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Format: YYYY-WW (e.g., "2025-01" for week 1 of 2025)
  RETURN TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(EXTRACT(WEEK FROM NOW())::TEXT, 2, '0');
END;
$$;

-- Function to get user's current content spark
CREATE OR REPLACE FUNCTION get_current_content_spark(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  prompts JSONB,
  generation_context JSONB,
  viewed_at TIMESTAMP WITH TIME ZONE,
  prompts_used INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE,
  is_new BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_week TEXT;
BEGIN
  SELECT get_current_week_identifier() INTO current_week;
  
  RETURN QUERY
  SELECT 
    cs.id,
    cs.prompts,
    cs.generation_context,
    cs.viewed_at,
    cs.prompts_used,
    cs.created_at,
    (cs.viewed_at IS NULL) as is_new
  FROM public.content_sparks cs
  WHERE cs.user_id = user_id_param 
    AND cs.week_identifier = current_week;
END;
$$;

-- Function to mark content spark as viewed
CREATE OR REPLACE FUNCTION mark_content_spark_viewed(content_spark_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.content_sparks 
  SET viewed_at = NOW()
  WHERE id = content_spark_id 
    AND user_id = auth.uid()
    AND viewed_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Function to record prompt usage
CREATE OR REPLACE FUNCTION record_prompt_usage(
  content_spark_id UUID,
  prompt_index INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.content_sparks 
  SET prompts_used = ARRAY_APPEND(
    COALESCE(prompts_used, '{}'), 
    prompt_index
  )
  WHERE id = content_spark_id 
    AND user_id = auth.uid()
    AND NOT (prompt_index = ANY(COALESCE(prompts_used, '{}')));
    
  RETURN FOUND;
END;
$$;

-- Function to get users who need content sparks (for cron job)
CREATE OR REPLACE FUNCTION get_users_needing_content_sparks()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  content_spark_notifications BOOLEAN,
  preferences JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_week TEXT;
BEGIN
  SELECT get_current_week_identifier() INTO current_week;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.content_spark_notifications,
    row_to_json(p)::JSONB as preferences
  FROM public.profiles p
  LEFT JOIN public.content_sparks cs ON (
    cs.user_id = p.id AND cs.week_identifier = current_week
  )
  WHERE p.content_spark_notifications = true
    AND p.onboarding_completed = true
    AND cs.id IS NULL; -- No content spark exists for this week
END;
$$;

-- Grant permissions
GRANT ALL ON public.content_sparks TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_week_identifier() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_content_spark(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_content_spark_viewed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_prompt_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_needing_content_sparks() TO service_role; 