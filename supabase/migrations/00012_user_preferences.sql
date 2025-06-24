-- User Preferences and Privacy Settings Migration
-- This migration creates a comprehensive user preferences system

-- Create user_preferences table for app behavior settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Notification Settings
  push_notifications_enabled BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  friend_request_notifications BOOLEAN DEFAULT true,
  story_notifications BOOLEAN DEFAULT true,
  group_notifications BOOLEAN DEFAULT true,
  reaction_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true,
  
  -- Privacy Settings
  allow_friend_requests BOOLEAN DEFAULT true,
  discoverable_by_email BOOLEAN DEFAULT true,
  discoverable_by_username BOOLEAN DEFAULT true,
  show_mutual_friends BOOLEAN DEFAULT true,
  show_friends_count BOOLEAN DEFAULT true,
  show_last_seen BOOLEAN DEFAULT true,
  profile_visibility TEXT CHECK (profile_visibility IN ('public', 'friends', 'private')) DEFAULT 'public',
  
  -- App Behavior Settings
  auto_save_to_journal BOOLEAN DEFAULT true,
  auto_download_media BOOLEAN DEFAULT false,
  read_receipts_enabled BOOLEAN DEFAULT true,
  typing_indicators_enabled BOOLEAN DEFAULT true,
  screenshot_notifications BOOLEAN DEFAULT true,
  
  -- Display Settings
  dark_mode_enabled BOOLEAN DEFAULT false,
  reduce_motion BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  font_size TEXT CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')) DEFAULT 'medium',
  
  -- Content Settings
  mature_content_filter BOOLEAN DEFAULT true,
  auto_play_videos BOOLEAN DEFAULT true,
  data_saver_mode BOOLEAN DEFAULT false,
  
  -- Language and Region
  language_code TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user preferences on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user preferences when profile is created
CREATE OR REPLACE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_preferences();

-- Create blocked_users table for user blocking functionality
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate blocks and no self-blocking
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
CREATE POLICY "Users can view their own blocks" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage their own blocks" ON public.blocked_users
  FOR ALL USING (auth.uid() = blocker_id);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(
  blocker_id_param UUID,
  blocked_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE blocker_id = blocker_id_param AND blocked_id = blocked_id_param
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to block a user
CREATE OR REPLACE FUNCTION public.block_user(
  target_user_id UUID,
  reason_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Cannot block yourself
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Insert block record
  INSERT INTO public.blocked_users (blocker_id, blocked_id, reason)
  VALUES (current_user_id, target_user_id, reason_text)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Remove any existing friendship
  DELETE FROM public.friends
  WHERE (user_id = current_user_id AND friend_id = target_user_id)
     OR (user_id = target_user_id AND friend_id = current_user_id);

  -- Archive any existing conversations
  UPDATE public.conversations
  SET archived_by = COALESCE(archived_by, '[]'::jsonb) || jsonb_build_array(current_user_id)
  WHERE id IN (
    SELECT DISTINCT conversation_id
    FROM public.conversation_participants cp1
    WHERE cp1.user_id = current_user_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = cp1.conversation_id
      AND cp2.user_id = target_user_id
    )
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION public.unblock_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  DELETE FROM public.blocked_users
  WHERE blocker_id = current_user_id AND blocked_id = target_user_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get complete user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences(user_id_param UUID)
RETURNS TABLE (
  push_notifications_enabled BOOLEAN,
  message_notifications BOOLEAN,
  friend_request_notifications BOOLEAN,
  story_notifications BOOLEAN,
  group_notifications BOOLEAN,
  reaction_notifications BOOLEAN,
  mention_notifications BOOLEAN,
  allow_friend_requests BOOLEAN,
  discoverable_by_email BOOLEAN,
  discoverable_by_username BOOLEAN,
  show_mutual_friends BOOLEAN,
  show_friends_count BOOLEAN,
  show_last_seen BOOLEAN,
  profile_visibility TEXT,
  auto_save_to_journal BOOLEAN,
  auto_download_media BOOLEAN,
  read_receipts_enabled BOOLEAN,
  typing_indicators_enabled BOOLEAN,
  screenshot_notifications BOOLEAN,
  dark_mode_enabled BOOLEAN,
  reduce_motion BOOLEAN,
  high_contrast BOOLEAN,
  font_size TEXT,
  mature_content_filter BOOLEAN,
  auto_play_videos BOOLEAN,
  data_saver_mode BOOLEAN,
  language_code TEXT,
  timezone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.push_notifications_enabled,
    up.message_notifications,
    up.friend_request_notifications,
    up.story_notifications,
    up.group_notifications,
    up.reaction_notifications,
    up.mention_notifications,
    up.allow_friend_requests,
    up.discoverable_by_email,
    up.discoverable_by_username,
    up.show_mutual_friends,
    up.show_friends_count,
    up.show_last_seen,
    up.profile_visibility,
    up.auto_save_to_journal,
    up.auto_download_media,
    up.read_receipts_enabled,
    up.typing_indicators_enabled,
    up.screenshot_notifications,
    up.dark_mode_enabled,
    up.reduce_motion,
    up.high_contrast,
    up.font_size,
    up.mature_content_filter,
    up.auto_play_videos,
    up.data_saver_mode,
    up.language_code,
    up.timezone
  FROM public.user_preferences up
  WHERE up.user_id = user_id_param;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- Initialize preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Add notification settings to user_stats (for tracking notification interactions)
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS notifications_opened INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS app_sessions INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS last_active_date DATE; 