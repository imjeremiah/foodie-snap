-- Cleanup and Reseed Demo Data
-- This migration provides functions to clean up broken demo data and reseed it properly

-- Function to clean up broken demo conversations for a specific user
CREATE OR REPLACE FUNCTION public.cleanup_user_demo_data()
RETURNS text AS $$
DECLARE
  current_user_id UUID;
  demo_friend_ids UUID[];
  deleted_conversations INTEGER := 0;
  deleted_participants INTEGER := 0;
  deleted_messages INTEGER := 0;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Get demo friend IDs for this user
  SELECT ARRAY(
    SELECT friend_id FROM public.friends 
    WHERE user_id = current_user_id 
    AND friend_id IN (
      SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
    )
  ) INTO demo_friend_ids;
  
  -- Clean up broken conversations involving demo friends
  -- Delete messages first (child records)
  DELETE FROM public.messages 
  WHERE conversation_id IN (
    SELECT DISTINCT cp.conversation_id 
    FROM public.conversation_participants cp
    WHERE cp.user_id = ANY(demo_friend_ids) OR cp.user_id = current_user_id
  );
  GET DIAGNOSTICS deleted_messages = ROW_COUNT;
  
  -- Delete conversation participants
  DELETE FROM public.conversation_participants 
  WHERE user_id = ANY(demo_friend_ids) OR user_id = current_user_id;
  GET DIAGNOSTICS deleted_participants = ROW_COUNT;
  
  -- Delete conversations
  DELETE FROM public.conversations 
  WHERE created_by = ANY(demo_friend_ids) OR created_by = current_user_id;
  GET DIAGNOSTICS deleted_conversations = ROW_COUNT;
  
  RETURN FORMAT('Cleaned up %s conversations, %s participants, %s messages', 
                deleted_conversations, deleted_participants, deleted_messages);
  
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error cleaning up demo data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved demo data seeding function that works with fixed policies
CREATE OR REPLACE FUNCTION public.reseed_demo_data()
RETURNS text AS $$
DECLARE
  current_user_id UUID;
  demo_friend_1 UUID;
  demo_friend_2 UUID;
  demo_friend_3 UUID;
  demo_friend_ids UUID[];
  conversation_1 UUID;
  conversation_2 UUID;
  conversation_3 UUID;
  cleanup_result TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to seed demo data';
  END IF;
  
  -- First, clean up any existing broken demo data
  SELECT public.cleanup_user_demo_data() INTO cleanup_result;
  RAISE NOTICE '%', cleanup_result;
  
  -- Check if demo friends already exist for this user
  IF EXISTS (
    SELECT 1 FROM public.friends f
    JOIN public.profiles p ON f.friend_id = p.id
    WHERE f.user_id = current_user_id 
    AND p.email LIKE '%demo.foodiesnap.com'
    AND f.status = 'accepted'
  ) THEN
    -- Demo friends exist, get their IDs
    SELECT ARRAY(
      SELECT f.friend_id FROM public.friends f
      JOIN public.profiles p ON f.friend_id = p.id
      WHERE f.user_id = current_user_id 
      AND p.email LIKE '%demo.foodiesnap.com'
      AND f.status = 'accepted'
      ORDER BY p.created_at
      LIMIT 3
    ) INTO demo_friend_ids;
    
    -- Assign individual friend IDs
    demo_friend_1 := demo_friend_ids[1];
    demo_friend_2 := demo_friend_ids[2];
    demo_friend_3 := demo_friend_ids[3];
    
    RAISE NOTICE 'Using existing demo friends: %, %, %', demo_friend_1, demo_friend_2, demo_friend_3;
  ELSE
    -- Create new demo friends
    demo_friend_1 := gen_random_uuid();
    demo_friend_2 := gen_random_uuid();
    demo_friend_3 := gen_random_uuid();
    
    -- Temporarily disable foreign key constraint
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    
    -- Insert demo friend profiles
    INSERT INTO public.profiles (id, email, display_name, bio, created_at, updated_at) VALUES
    (demo_friend_1, 'alex.chen@demo.foodiesnap.com', 'Alex Chen', 'Protein-focused fitness enthusiast 💪 Sharing my muscle-building meal prep journey!', NOW() - INTERVAL '7 days', NOW() - INTERVAL '30 minutes'),
    (demo_friend_2, 'sarah.johnson@demo.foodiesnap.com', 'Sarah Johnson', 'Plant-based athlete 🌱 Proving you can be strong on plants! Marathon runner & recipe creator.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours'),
    (demo_friend_3, 'mike.rodriguez@demo.foodiesnap.com', 'Mike Rodriguez', 'HIIT trainer & nutrition coach 🔥 Helping others crush their fitness goals with smart meal timing!', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour');
    
    -- Re-enable foreign key constraint
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
    
    -- Create friendships (both directions)
    INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at) VALUES
    (current_user_id, demo_friend_1, 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
    (current_user_id, demo_friend_2, 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    (current_user_id, demo_friend_3, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    (demo_friend_1, current_user_id, 'accepted', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
    (demo_friend_2, current_user_id, 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    (demo_friend_3, current_user_id, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
    
    RAISE NOTICE 'Created new demo friends: %, %, %', demo_friend_1, demo_friend_2, demo_friend_3;
  END IF;
  
  -- Now create conversations with proper error handling
  conversation_1 := gen_random_uuid();
  conversation_2 := gen_random_uuid();
  conversation_3 := gen_random_uuid();
  
  -- Create conversations one by one with error handling
  BEGIN
    INSERT INTO public.conversations (id, created_by, created_at, updated_at)
    VALUES (conversation_1, current_user_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 minutes');
    
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at) VALUES
    (conversation_1, current_user_id, NOW() - INTERVAL '2 hours'),
    (conversation_1, demo_friend_1, NOW() - INTERVAL '2 hours');
    
    RAISE NOTICE 'Created conversation 1 with Alex';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Failed to create conversation 1: %', SQLERRM;
  END;
  
  BEGIN
    INSERT INTO public.conversations (id, created_by, created_at, updated_at)
    VALUES (conversation_2, current_user_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours');
    
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at) VALUES
    (conversation_2, current_user_id, NOW() - INTERVAL '1 day'),
    (conversation_2, demo_friend_2, NOW() - INTERVAL '1 day');
    
    RAISE NOTICE 'Created conversation 2 with Sarah';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Failed to create conversation 2: %', SQLERRM;
  END;
  
  BEGIN
    INSERT INTO public.conversations (id, created_by, created_at, updated_at)
    VALUES (conversation_3, demo_friend_3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');
    
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at) VALUES
    (conversation_3, current_user_id, NOW() - INTERVAL '3 days'),
    (conversation_3, demo_friend_3, NOW() - INTERVAL '3 days');
    
    RAISE NOTICE 'Created conversation 3 with Mike';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'Failed to create conversation 3: %', SQLERRM;
  END;
  
  -- Add messages to successful conversations
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at, read_by) VALUES
  -- Conversation 1 with Alex (if it exists)
  (conversation_1, demo_friend_1, 'Hey! 👋 Welcome to FoodieSnap!', 'text', NOW() - INTERVAL '2 hours', '{}'),
  (conversation_1, demo_friend_1, 'I see you''re getting into meal prep - that''s awesome! 💪', 'text', NOW() - INTERVAL '1 hour 45 minutes', '{}'),
  (conversation_1, current_user_id, 'Thanks! Yeah, trying to get more consistent with my nutrition', 'text', NOW() - INTERVAL '1 hour 30 minutes', '{}'),
  (conversation_1, demo_friend_1, 'Perfect! I just posted my Sunday prep routine. High-protein recipes that actually taste good! 🔥', 'text', NOW() - INTERVAL '1 hour 15 minutes', '{}'),
  (conversation_1, demo_friend_1, 'Let me know if you want any recipe tips! Always happy to help a fellow fitness enthusiast', 'text', NOW() - INTERVAL '5 minutes', '{}')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at, read_by) VALUES
  -- Conversation 2 with Sarah (if it exists)
  (conversation_2, demo_friend_2, 'Love your content! 🌱 Are you following any specific nutrition plan?', 'text', NOW() - INTERVAL '1 day', '{}'),
  (conversation_2, current_user_id, 'Still figuring it out honestly. What works for you?', 'text', NOW() - INTERVAL '20 hours', '{}'),
  (conversation_2, demo_friend_2, 'I focus on whole foods and plant-based proteins. Check out my latest post about protein combining! 🥗', 'text', NOW() - INTERVAL '18 hours', '{}'),
  (conversation_2, demo_friend_2, 'Also, timing your carbs around workouts makes a huge difference for energy ⚡', 'text', NOW() - INTERVAL '2 hours', '{}')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at, read_by) VALUES
  -- Conversation 3 with Mike (if it exists)  
  (conversation_3, demo_friend_3, 'Saw your workout post - nice form! 💥', 'text', NOW() - INTERVAL '3 days', '{}'),
  (conversation_3, current_user_id, 'Thanks! Still learning proper technique', 'text', NOW() - INTERVAL '2 days 20 hours', '{}'),
  (conversation_3, demo_friend_3, 'That''s the key - consistency over intensity. Your progress is going to be amazing! 🚀', 'text', NOW() - INTERVAL '2 days 18 hours', '{}'),
  (conversation_3, demo_friend_3, 'If you ever want some HIIT workout ideas or nutrition timing tips, just ask! 🔥', 'text', NOW() - INTERVAL '1 day', '{}')
  ON CONFLICT DO NOTHING;
  
  -- Create spotlight content
  PERFORM public.seed_spotlight_content();
  
  RETURN 'Successfully reseeded demo data! 🎉 You now have 3 demo friends with active conversations and spotlight content. Check your chats!';
  
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error reseeding demo data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_user_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reseed_demo_data() TO authenticated;
