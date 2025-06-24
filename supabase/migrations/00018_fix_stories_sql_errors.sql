-- Migration to fix SQL ambiguous column reference errors in stories system
-- Fixes: "column reference user_id is ambiguous" error

-- Drop and recreate get_stories_feed function with fixed aliases
DROP FUNCTION IF EXISTS public.get_stories_feed();

CREATE OR REPLACE FUNCTION public.get_stories_feed()
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

-- Drop and recreate get_user_stories function with fixed aliases
DROP FUNCTION IF EXISTS public.get_user_stories(UUID);

CREATE OR REPLACE FUNCTION public.get_user_stories(target_user_id UUID)
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

-- Drop and recreate RLS policy with fixed aliases
DROP POLICY IF EXISTS "Users can view stories from friends and themselves" ON public.stories;

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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_stories_feed() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stories(UUID) TO authenticated; 