-- Profile Statistics Tracking Migration
-- This migration adds statistics tracking for user profiles

-- Add statistics columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS snap_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_snap_date DATE;

-- Create user_stats table for detailed statistics tracking
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  snaps_sent INTEGER DEFAULT 0,
  snaps_received INTEGER DEFAULT 0,
  photos_shared INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  friends_added INTEGER DEFAULT 0,
  stories_posted INTEGER DEFAULT 0,
  total_reactions_given INTEGER DEFAULT 0,
  total_reactions_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_stats table
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at on user_stats
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user stats on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user stats when profile is created
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_stats();

-- Function to update snap score and streaks
CREATE OR REPLACE FUNCTION public.update_snap_stats(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  last_snap DATE;
  current_date_val DATE := CURRENT_DATE;
  new_streak INTEGER := 0;
BEGIN
  -- Get the user's last snap date
  SELECT last_snap_date INTO last_snap
  FROM public.profiles
  WHERE id = user_id_param;

  -- Calculate streak
  IF last_snap IS NULL THEN
    -- First snap ever
    new_streak := 1;
  ELSIF last_snap = current_date_val THEN
    -- Already snapped today, don't change streak
    RETURN;
  ELSIF last_snap = current_date_val - INTERVAL '1 day' THEN
    -- Snapped yesterday, continue streak
    SELECT current_streak + 1 INTO new_streak
    FROM public.profiles
    WHERE id = user_id_param;
  ELSE
    -- Streak broken, start over
    new_streak := 1;
  END IF;

  -- Update profile with new stats
  UPDATE public.profiles
  SET 
    snap_score = snap_score + 1,
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_snap_date = current_date_val,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Update user_stats
  UPDATE public.user_stats
  SET 
    snaps_sent = snaps_sent + 1,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to increment various stats
CREATE OR REPLACE FUNCTION public.increment_user_stat(
  user_id_param UUID,
  stat_name TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  CASE stat_name
    WHEN 'snaps_received' THEN
      UPDATE public.user_stats 
      SET snaps_received = snaps_received + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'photos_shared' THEN
      UPDATE public.user_stats 
      SET photos_shared = photos_shared + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'messages_sent' THEN
      UPDATE public.user_stats 
      SET messages_sent = messages_sent + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'friends_added' THEN
      UPDATE public.user_stats 
      SET friends_added = friends_added + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'stories_posted' THEN
      UPDATE public.user_stats 
      SET stories_posted = stories_posted + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'reactions_given' THEN
      UPDATE public.user_stats 
      SET total_reactions_given = total_reactions_given + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    WHEN 'reactions_received' THEN
      UPDATE public.user_stats 
      SET total_reactions_received = total_reactions_received + increment_by, updated_at = NOW()
      WHERE user_id = user_id_param;
    ELSE
      RAISE EXCEPTION 'Unknown stat name: %', stat_name;
  END CASE;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get user's complete stats
CREATE OR REPLACE FUNCTION public.get_user_complete_stats(user_id_param UUID)
RETURNS TABLE (
  snap_score INTEGER,
  current_streak INTEGER,
  longest_streak INTEGER,
  last_snap_date DATE,
  snaps_sent INTEGER,
  snaps_received INTEGER,
  photos_shared INTEGER,
  messages_sent INTEGER,
  friends_count BIGINT,
  friends_added INTEGER,
  stories_posted INTEGER,
  total_reactions_given INTEGER,
  total_reactions_received INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.snap_score,
    p.current_streak,
    p.longest_streak,
    p.last_snap_date,
    COALESCE(us.snaps_sent, 0),
    COALESCE(us.snaps_received, 0),
    COALESCE(us.photos_shared, 0),
    COALESCE(us.messages_sent, 0),
    COALESCE(friend_count.count, 0),
    COALESCE(us.friends_added, 0),
    COALESCE(us.stories_posted, 0),
    COALESCE(us.total_reactions_given, 0),
    COALESCE(us.total_reactions_received, 0)
  FROM public.profiles p
  LEFT JOIN public.user_stats us ON p.id = us.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.friends
    WHERE status = 'accepted'
    GROUP BY user_id
  ) friend_count ON p.id = friend_count.user_id
  WHERE p.id = user_id_param;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_snap_score ON public.profiles(snap_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON public.profiles(current_streak DESC);

-- Initialize stats for existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING; 