-- Fix Demo Data Seeding Function
-- This migration fixes the seed_demo_data function to work with foreign key constraints

-- Drop the existing function that has constraint issues
DROP FUNCTION IF EXISTS public.seed_demo_data();

-- Create a new working seed function that creates demo friends for the current user
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS text AS $$
DECLARE
  current_user_id UUID;
  demo_friend_1 UUID;
  demo_friend_2 UUID;
  demo_friend_3 UUID;
  conversation_1 UUID;
  conversation_2 UUID;
  conversation_3 UUID;
  current_user_profile RECORD;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to seed demo data';
  END IF;
  
  -- Get current user profile
  SELECT * INTO current_user_profile FROM public.profiles WHERE id = current_user_id;
  
  IF current_user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found. Please ensure your profile is created first.';
  END IF;
  
  -- Check if demo data already exists
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email LIKE '%demo.foodiesnap.com' 
    AND id IN (
      SELECT friend_id FROM public.friends WHERE user_id = current_user_id
    )
  ) THEN
    RETURN 'Demo data already exists for this user';
  END IF;
  
  -- Generate unique demo friend IDs (using random UUIDs)
  demo_friend_1 := gen_random_uuid();
  demo_friend_2 := gen_random_uuid();
  demo_friend_3 := gen_random_uuid();
  
  -- Temporarily disable foreign key constraint for demo profiles
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  
  -- Insert demo friend profiles
  INSERT INTO public.profiles (id, email, display_name, bio, created_at, updated_at) VALUES
  (demo_friend_1, 'alex.chen@demo.foodiesnap.com', 'Alex Chen', 'Protein-focused fitness enthusiast 💪 Sharing my muscle-building meal prep journey!', NOW() - INTERVAL '7 days', NOW() - INTERVAL '30 minutes'),
  (demo_friend_2, 'sarah.johnson@demo.foodiesnap.com', 'Sarah Johnson', 'Plant-based athlete 🌱 Proving you can be strong on plants! Marathon runner & recipe creator.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
  (demo_friend_3, 'mike.rodriguez@demo.foodiesnap.com', 'Mike Rodriguez', 'HIIT trainer & nutrition coach 🔥 Helping others crush their fitness goals with smart meal timing!', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour');
  
  -- Re-enable foreign key constraint with NOT VALID (allows existing data)
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  
  -- Create friendships (both directions for proper mutual friendship)
  INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at) VALUES
  -- Current user to demo friends
  (current_user_id, demo_friend_1, 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  (current_user_id, demo_friend_2, 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (current_user_id, demo_friend_3, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  -- Demo friends to current user (mutual)
  (demo_friend_1, current_user_id, 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  (demo_friend_2, current_user_id, 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (demo_friend_3, current_user_id, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
  
  -- Create conversations
  INSERT INTO public.conversations (id, created_by, created_at, updated_at) VALUES
  (gen_random_uuid(), current_user_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 minutes'),
  (gen_random_uuid(), current_user_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), demo_friend_2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
  RETURNING id;
  
  -- Get conversation IDs (we'll use the first three created)
  SELECT id INTO conversation_1 FROM public.conversations WHERE created_by = current_user_id ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO conversation_2 FROM public.conversations WHERE created_by = current_user_id ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO conversation_3 FROM public.conversations WHERE created_by = demo_friend_2 ORDER BY created_at DESC LIMIT 1;
  
  -- Add conversation participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at) VALUES
  -- Conversation 1: Current user + Alex
  (conversation_1, current_user_id, NOW() - INTERVAL '2 hours'),
  (conversation_1, demo_friend_1, NOW() - INTERVAL '2 hours'),
  -- Conversation 2: Current user + Sarah  
  (conversation_2, current_user_id, NOW() - INTERVAL '1 day'),
  (conversation_2, demo_friend_2, NOW() - INTERVAL '1 day'),
  -- Conversation 3: Current user + Mike
  (conversation_3, current_user_id, NOW() - INTERVAL '3 days'),
  (conversation_3, demo_friend_3, NOW() - INTERVAL '3 days');
  
  -- Add realistic demo messages
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at, read_by) VALUES
  -- Conversation 1 with Alex (most recent)
  (conversation_1, demo_friend_1, 'Hey! 👋 Welcome to FoodieSnap!', 'text', NOW() - INTERVAL '2 hours', '{}'),
  (conversation_1, demo_friend_1, 'I see you''re getting into meal prep - that''s awesome! 💪', 'text', NOW() - INTERVAL '1 hour 45 minutes', '{}'),
  (conversation_1, current_user_id, 'Thanks! Yeah, trying to get more consistent with my nutrition', 'text', NOW() - INTERVAL '1 hour 30 minutes', '{}'),
  (conversation_1, demo_friend_1, 'Perfect! I just posted my Sunday prep routine. High-protein recipes that actually taste good! 🔥', 'text', NOW() - INTERVAL '1 hour 15 minutes', '{}'),
  (conversation_1, demo_friend_1, 'Let me know if you want any recipe tips! Always happy to help a fellow fitness enthusiast', 'text', NOW() - INTERVAL '5 minutes', '{}'),
  
  -- Conversation 2 with Sarah (moderate activity)
  (conversation_2, demo_friend_2, 'Love your content! 🌱 Are you following any specific nutrition plan?', 'text', NOW() - INTERVAL '1 day', '{}'),
  (conversation_2, current_user_id, 'Still figuring it out honestly. What works for you?', 'text', NOW() - INTERVAL '20 hours', '{}'),
  (conversation_2, demo_friend_2, 'I focus on whole foods and plant-based proteins. Check out my latest post about protein combining! 🥗', 'text', NOW() - INTERVAL '18 hours', '{}'),
  (conversation_2, demo_friend_2, 'Also, timing your carbs around workouts makes a huge difference for energy ⚡', 'text', NOW() - INTERVAL '2 hours', '{}'),
  
  -- Conversation 3 with Mike (older but engaging)
  (conversation_3, demo_friend_3, 'Saw your workout post - nice form! 💥', 'text', NOW() - INTERVAL '3 days', '{}'),
  (conversation_3, current_user_id, 'Thanks! Still learning proper technique', 'text', NOW() - INTERVAL '2 days 20 hours', '{}'),
  (conversation_3, demo_friend_3, 'That''s the key - consistency over intensity. Your progress is going to be amazing! 🚀', 'text', NOW() - INTERVAL '2 days 18 hours', '{}'),
  (conversation_3, demo_friend_3, 'If you ever want some HIIT workout ideas or nutrition timing tips, just ask! 🔥', 'text', NOW() - INTERVAL '1 day', '{}');
  
  RETURN 'Successfully created demo data! 🎉 You now have 3 demo friends (Alex, Sarah, Mike) with active conversations. Check your chat list to see them!';
  
EXCEPTION
  WHEN others THEN
    -- Re-enable constraint on error
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
    
    RAISE EXCEPTION 'Error creating demo data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
