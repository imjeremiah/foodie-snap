-- Spotlight System Migration
-- This migration creates the public content discovery system for FoodieSnap

-- Create spotlight_posts table for public content
CREATE TABLE IF NOT EXISTS public.spotlight_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  
  -- Content metadata
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  content_type TEXT CHECK (content_type IN ('photo', 'video')) DEFAULT 'photo',
  
  -- Engagement metrics
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Content categorization
  tags TEXT[],
  
  -- Moderation and safety
  is_flagged BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  moderation_reason TEXT,
  
  -- Privacy and visibility controls
  is_public BOOLEAN DEFAULT true,
  audience_restriction TEXT CHECK (audience_restriction IN ('public', 'friends', 'friends_of_friends')) DEFAULT 'public',
  
  -- Technical metadata
  dimensions JSONB,
  location_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spotlight_reactions table for user interactions
CREATE TABLE IF NOT EXISTS public.spotlight_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.spotlight_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'heart', 'fire', 'wow')) DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one reaction per user per post
  UNIQUE(post_id, user_id)
);

-- Create spotlight_reports table for content moderation
CREATE TABLE IF NOT EXISTS public.spotlight_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.spotlight_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_reason TEXT CHECK (report_reason IN ('inappropriate', 'spam', 'harassment', 'copyright', 'other')) NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports from same user
  UNIQUE(post_id, reporter_id)
);

-- Enable RLS on all spotlight tables
ALTER TABLE public.spotlight_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spotlight_posts
CREATE POLICY "Users can view public approved posts" ON public.spotlight_posts
  FOR SELECT USING (
    is_public = true 
    AND is_approved = true 
    AND is_flagged = false
    AND (audience_restriction = 'public' OR
         (audience_restriction = 'friends' AND user_id IN (
           SELECT friend_id FROM public.friends 
           WHERE user_id = auth.uid() AND status = 'accepted'
         )) OR
         (audience_restriction = 'friends_of_friends' AND user_id IN (
           SELECT DISTINCT f2.friend_id FROM public.friends f1
           JOIN public.friends f2 ON f1.friend_id = f2.user_id
           WHERE f1.user_id = auth.uid() AND f1.status = 'accepted' AND f2.status = 'accepted'
         )))
  );

CREATE POLICY "Users can view their own posts" ON public.spotlight_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON public.spotlight_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.spotlight_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.spotlight_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for spotlight_reactions  
CREATE POLICY "Users can view reactions on visible posts" ON public.spotlight_reactions
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.spotlight_posts
      WHERE is_public = true AND is_approved = true AND is_flagged = false
    )
  );

CREATE POLICY "Users can manage their own reactions" ON public.spotlight_reactions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for spotlight_reports
CREATE POLICY "Users can view their own reports" ON public.spotlight_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON public.spotlight_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Add triggers for updated_at on spotlight_posts
CREATE TRIGGER update_spotlight_posts_updated_at BEFORE UPDATE ON public.spotlight_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spotlight_posts_user_id ON public.spotlight_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_posts_created_at ON public.spotlight_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spotlight_posts_public ON public.spotlight_posts(is_public, is_approved, is_flagged);
CREATE INDEX IF NOT EXISTS idx_spotlight_posts_like_count ON public.spotlight_posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_spotlight_posts_tags ON public.spotlight_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_spotlight_reactions_post_id ON public.spotlight_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_reactions_user_id ON public.spotlight_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_reports_post_id ON public.spotlight_reports(post_id);

-- Function to update engagement metrics when reactions change
CREATE OR REPLACE FUNCTION public.update_spotlight_engagement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE public.spotlight_posts
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE public.spotlight_posts
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Triggers to automatically update engagement metrics
CREATE OR REPLACE TRIGGER on_spotlight_reaction_insert
  AFTER INSERT ON public.spotlight_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_spotlight_engagement();

CREATE OR REPLACE TRIGGER on_spotlight_reaction_delete
  AFTER DELETE ON public.spotlight_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_spotlight_engagement();

-- Function to create spotlight post from journal entry
CREATE OR REPLACE FUNCTION public.share_to_spotlight(
  journal_entry_id_param UUID,
  caption_param TEXT DEFAULT NULL,
  audience_restriction_param TEXT DEFAULT 'public'
)
RETURNS UUID AS $$
DECLARE
  journal_entry public.journal_entries%ROWTYPE;
  new_post_id UUID;
BEGIN
  -- Get journal entry details
  SELECT * INTO journal_entry
  FROM public.journal_entries
  WHERE id = journal_entry_id_param AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal entry not found or access denied';
  END IF;

  -- Create spotlight post
  INSERT INTO public.spotlight_posts (
    user_id,
    journal_entry_id,
    image_url,
    thumbnail_url,
    caption,
    content_type,
    tags,
    audience_restriction,
    dimensions
  )
  VALUES (
    journal_entry.user_id,
    journal_entry.id,
    journal_entry.image_url,
    journal_entry.thumbnail_url,
    COALESCE(caption_param, journal_entry.caption),
    journal_entry.content_type,
    journal_entry.tags,
    audience_restriction_param,
    journal_entry.dimensions
  )
  RETURNING id INTO new_post_id;

  -- Update journal entry to mark as shared to spotlight
  UPDATE public.journal_entries
  SET shared_to_spotlight = true,
      updated_at = NOW()
  WHERE id = journal_entry_id_param;

  -- Update user stats
  UPDATE public.user_stats
  SET stories_posted = stories_posted + 1,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN new_post_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get spotlight feed with filtering and ordering
CREATE OR REPLACE FUNCTION public.get_spotlight_feed(
  feed_type TEXT DEFAULT 'recent',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  content_type TEXT,
  like_count INTEGER,
  view_count INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  user_has_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    p.display_name,
    p.avatar_url,
    sp.image_url,
    sp.thumbnail_url,
    sp.caption,
    sp.content_type,
    sp.like_count,
    sp.view_count,
    sp.tags,
    sp.created_at,
    EXISTS(
      SELECT 1 FROM public.spotlight_reactions sr
      WHERE sr.post_id = sp.id AND sr.user_id = auth.uid()
    ) as user_has_liked
  FROM public.spotlight_posts sp
  JOIN public.profiles p ON sp.user_id = p.id
  WHERE sp.is_public = true 
    AND sp.is_approved = true 
    AND sp.is_flagged = false
  ORDER BY 
    CASE 
      WHEN feed_type = 'popular' THEN sp.like_count
      ELSE 0
    END DESC,
    sp.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to toggle reaction on a post
CREATE OR REPLACE FUNCTION public.toggle_spotlight_reaction(
  post_id_param UUID,
  reaction_type_param TEXT DEFAULT 'like'
)
RETURNS BOOLEAN AS $$
DECLARE
  reaction_exists BOOLEAN;
  current_user_id UUID := auth.uid();
BEGIN
  -- Check if reaction already exists
  SELECT EXISTS(
    SELECT 1 FROM public.spotlight_reactions
    WHERE post_id = post_id_param AND user_id = current_user_id
  ) INTO reaction_exists;

  IF reaction_exists THEN
    -- Remove reaction
    DELETE FROM public.spotlight_reactions
    WHERE post_id = post_id_param AND user_id = current_user_id;
    RETURN false;
  ELSE
    -- Add reaction
    INSERT INTO public.spotlight_reactions (post_id, user_id, reaction_type)
    VALUES (post_id_param, current_user_id, reaction_type_param)
    ON CONFLICT (post_id, user_id) DO UPDATE SET 
      reaction_type = reaction_type_param,
      created_at = NOW();
    RETURN true;
  END IF;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to report content
CREATE OR REPLACE FUNCTION public.report_spotlight_post(
  post_id_param UUID,
  report_reason_param TEXT,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
BEGIN
  INSERT INTO public.spotlight_reports (
    post_id,
    reporter_id,
    report_reason,
    description
  )
  VALUES (
    post_id_param,
    auth.uid(),
    report_reason_param,
    description_param
  )
  ON CONFLICT (post_id, reporter_id) DO UPDATE SET
    report_reason = report_reason_param,
    description = description_param,
    created_at = NOW()
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permissions for authenticated users
GRANT EXECUTE ON FUNCTION public.share_to_spotlight(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_spotlight_feed(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_spotlight_reaction(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_spotlight_post(UUID, TEXT, TEXT) TO authenticated; 