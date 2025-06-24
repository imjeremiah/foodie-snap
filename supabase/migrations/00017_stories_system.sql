-- Migration for Phase 2.1 Step 11: Stories System
-- Implements ephemeral stories with 24-hour expiration and view tracking

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content metadata
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  content_type TEXT CHECK (content_type IN ('photo', 'video')) DEFAULT 'photo',
  
  -- Technical metadata
  file_size INTEGER,
  dimensions JSONB, -- { width: number, height: number }
  
  -- Stories-specific settings
  viewing_duration INTEGER DEFAULT 5, -- seconds
  background_color TEXT, -- hex color for text-only stories
  
  -- Expiration (24 hours)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  
  -- View tracking
  view_count INTEGER DEFAULT 0,
  viewed_by JSONB DEFAULT '{}', -- user_id -> { timestamp, first_viewed_at }
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure expiration constraint
  CONSTRAINT stories_expires_within_24h CHECK (expires_at <= created_at + INTERVAL '24 hours')
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_viewed_by ON public.stories USING GIN (viewed_by);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Users can view stories from friends and themselves" ON public.stories
  FOR SELECT USING (
    user_id = auth.uid() OR  -- Own stories
    user_id IN (  -- Friends' stories (mutual friendship)
      SELECT f1.friend_id FROM public.friends f1
      WHERE f1.user_id = auth.uid() AND f1.status = 'accepted'
      INTERSECT
      SELECT f2.user_id FROM public.friends f2
      WHERE f2.friend_id = auth.uid() AND f2.status = 'accepted'
    ) OR
    user_id IN (  -- Friends' stories (single direction for compatibility)
      SELECT f.friend_id FROM public.friends f
      WHERE f.user_id = auth.uid() AND f.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Function to record story view
CREATE OR REPLACE FUNCTION record_story_view(
  story_id_param UUID,
  viewer_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  current_viewed JSONB;
  current_view_data JSONB;
  new_view_data JSONB;
  story_owner UUID;
  result JSON;
BEGIN
  -- Get story owner and current viewed_by data
  SELECT user_id, viewed_by INTO story_owner, current_viewed
  FROM public.stories
  WHERE id = story_id_param AND expires_at > NOW();
  
  -- Check if story exists and hasn't expired
  IF story_owner IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Story not found or expired');
  END IF;
  
  -- Don't track views for story owner viewing their own story
  IF story_owner = viewer_id_param THEN
    RETURN json_build_object('success', true, 'is_owner', true);
  END IF;
  
  -- Check if user has already viewed this story
  current_view_data := current_viewed -> viewer_id_param::TEXT;
  
  -- If no previous view, create new entry
  IF current_view_data IS NULL THEN
    new_view_data := jsonb_build_object(
      'timestamp', NOW(),
      'first_viewed_at', NOW()
    );
    
    -- Update the story with new view data and increment view count
    UPDATE public.stories
    SET 
      viewed_by = viewed_by || jsonb_build_object(viewer_id_param::TEXT, new_view_data),
      view_count = view_count + 1,
      updated_at = NOW()
    WHERE id = story_id_param;
    
    result := json_build_object(
      'success', true,
      'is_first_view', true,
      'view_count', (SELECT view_count FROM public.stories WHERE id = story_id_param)
    );
  ELSE
    -- Update timestamp for repeat view (but don't increment count)
    new_view_data := current_view_data || jsonb_build_object('timestamp', NOW());
    
    UPDATE public.stories
    SET 
      viewed_by = viewed_by || jsonb_build_object(viewer_id_param::TEXT, new_view_data),
      updated_at = NOW()
    WHERE id = story_id_param;
    
    result := json_build_object(
      'success', true,
      'is_first_view', false,
      'view_count', (SELECT view_count FROM public.stories WHERE id = story_id_param)
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stories for current user and friends
CREATE OR REPLACE FUNCTION get_stories_feed()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  content_type TEXT,
  viewing_duration INTEGER,
  view_count INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  user_has_viewed BOOLEAN,
  is_own_story BOOLEAN,
  total_stories INTEGER -- Number of stories this user has
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.user_id)
    s.id,
    s.user_id,
    p.display_name,
    p.avatar_url,
    s.image_url,
    s.thumbnail_url,
    s.caption,
    s.content_type,
    s.viewing_duration,
    s.view_count,
    s.expires_at,
    s.created_at,
    (s.viewed_by ? auth.uid()::TEXT) as user_has_viewed,
    (s.user_id = auth.uid()) as is_own_story,
    (SELECT COUNT(*)::INTEGER FROM public.stories s2 
     WHERE s2.user_id = s.user_id AND s2.expires_at > NOW()) as total_stories
  FROM public.stories s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.expires_at > NOW()
    AND (
      s.user_id = auth.uid() OR  -- Own stories first
      s.user_id IN (  -- Friends' stories
        SELECT f.friend_id FROM public.friends f
        WHERE f.user_id = auth.uid() AND f.status = 'accepted'
      )
    )
  ORDER BY s.user_id, (s.user_id = auth.uid()) DESC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all stories for a specific user
CREATE OR REPLACE FUNCTION get_user_stories(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  content_type TEXT,
  viewing_duration INTEGER,
  view_count INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  user_has_viewed BOOLEAN,
  is_own_story BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    p.display_name,
    p.avatar_url,
    s.image_url,
    s.thumbnail_url,
    s.caption,
    s.content_type,
    s.viewing_duration,
    s.view_count,
    s.expires_at,
    s.created_at,
    (s.viewed_by ? auth.uid()::TEXT) as user_has_viewed,
    (s.user_id = auth.uid()) as is_own_story
  FROM public.stories s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.user_id = target_user_id 
    AND s.expires_at > NOW()
    AND (
      s.user_id = auth.uid() OR  -- Own stories
      s.user_id IN (  -- Friends' stories
        SELECT f.friend_id FROM public.friends f
        WHERE f.user_id = auth.uid() AND f.status = 'accepted'
      )
    )
  ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a story from journal entry
CREATE OR REPLACE FUNCTION create_story_from_journal(
  journal_entry_id_param UUID,
  caption_param TEXT DEFAULT NULL,
  viewing_duration_param INTEGER DEFAULT 5
) 
RETURNS UUID AS $$
DECLARE
  journal_entry RECORD;
  new_story_id UUID;
BEGIN
  -- Get journal entry details
  SELECT * INTO journal_entry
  FROM public.journal_entries
  WHERE id = journal_entry_id_param AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry not found or access denied';
  END IF;

  -- Create story
  INSERT INTO public.stories (
    user_id,
    image_url,
    thumbnail_url,
    caption,
    content_type,
    viewing_duration,
    file_size,
    dimensions
  )
  VALUES (
    journal_entry.user_id,
    journal_entry.image_url,
    journal_entry.thumbnail_url,
    COALESCE(caption_param, journal_entry.caption),
    journal_entry.content_type,
    viewing_duration_param,
    journal_entry.file_size,
    journal_entry.dimensions
  )
  RETURNING id INTO new_story_id;

  -- Update journal entry to mark as shared to story
  UPDATE public.journal_entries
  SET shared_to_story = true,
      updated_at = NOW()
  WHERE id = journal_entry_id_param;

  -- Update user stats
  UPDATE public.user_stats
  SET stories_posted = stories_posted + 1,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN new_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired stories (to be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.stories 
  WHERE expires_at <= NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION record_story_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stories_feed() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_story_from_journal(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_stories() TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stories_updated_at 
  BEFORE UPDATE ON public.stories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 