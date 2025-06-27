-- Fix for Content Sparks - Missing Table
-- Copy and paste this into Supabase Dashboard → SQL Editor

-- Create the missing content_sparks table
CREATE TABLE IF NOT EXISTS public.content_sparks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_identifier TEXT NOT NULL,
  prompts JSONB NOT NULL,
  generation_context JSONB DEFAULT '{}',
  viewed_at TIMESTAMP WITH TIME ZONE,
  prompts_used INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_identifier)
);

-- Enable Row Level Security
ALTER TABLE public.content_sparks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
DROP POLICY IF EXISTS "Users can view their own content sparks" ON public.content_sparks;
CREATE POLICY "Users can view their own content sparks" ON public.content_sparks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own content sparks" ON public.content_sparks;  
CREATE POLICY "Users can update their own content sparks" ON public.content_sparks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own content sparks" ON public.content_sparks;
CREATE POLICY "Users can insert their own content sparks" ON public.content_sparks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS content_sparks_user_id_idx ON public.content_sparks(user_id);
CREATE INDEX IF NOT EXISTS content_sparks_week_idx ON public.content_sparks(week_identifier);

-- Add notification preferences to profiles table if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='content_spark_notifications') THEN
    ALTER TABLE public.profiles ADD COLUMN content_spark_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='content_spark_day') THEN
    ALTER TABLE public.profiles ADD COLUMN content_spark_day INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='content_spark_time') THEN
    ALTER TABLE public.profiles ADD COLUMN content_spark_time TIME DEFAULT '09:00:00';
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.content_sparks TO authenticated;

-- Success message
SELECT 'Content Sparks table created successfully! The feature should now work.' as status; 