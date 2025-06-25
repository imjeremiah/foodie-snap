-- Add Simple Cleanup Function
-- This migration provides a function to completely reset demo data for the current user

-- Function to completely clean up all demo data for current user
CREATE OR REPLACE FUNCTION public.clean_my_demo_data()
RETURNS text AS $$
DECLARE
  current_user_id UUID;
  demo_friend_ids UUID[];
  deleted_count INTEGER := 0;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Get all demo friend IDs
  SELECT ARRAY(
    SELECT id FROM public.profiles 
    WHERE email LIKE '%demo.foodiesnap.com'
  ) INTO demo_friend_ids;
  
  -- Delete all messages involving current user or demo friends
  DELETE FROM public.messages 
  WHERE sender_id = current_user_id 
     OR conversation_id IN (
       SELECT conversation_id FROM public.conversation_participants 
       WHERE user_id = current_user_id OR user_id = ANY(demo_friend_ids)
     );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % messages', deleted_count;
  
  -- Delete all conversation participants involving current user or demo friends
  DELETE FROM public.conversation_participants 
  WHERE user_id = current_user_id OR user_id = ANY(demo_friend_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % conversation participants', deleted_count;
  
  -- Delete all conversations created by current user or demo friends
  DELETE FROM public.conversations 
  WHERE created_by = current_user_id OR created_by = ANY(demo_friend_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % conversations', deleted_count;
  
  -- Delete friendships with demo friends
  DELETE FROM public.friends 
  WHERE (user_id = current_user_id AND friend_id = ANY(demo_friend_ids))
     OR (user_id = ANY(demo_friend_ids) AND friend_id = current_user_id);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % friendships', deleted_count;
  
  -- Delete demo friend profiles
  DELETE FROM public.profiles WHERE id = ANY(demo_friend_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % demo profiles', deleted_count;
  
  -- Delete demo spotlight posts
  DELETE FROM public.spotlight_reactions WHERE post_id IN (
    SELECT id FROM public.spotlight_posts WHERE user_id = ANY(demo_friend_ids)
  );
  DELETE FROM public.spotlight_posts WHERE user_id = ANY(demo_friend_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % spotlight posts', deleted_count;
  
  RETURN 'Successfully cleaned up all demo data! 🧹 You can now try seeding fresh demo data.';
  
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error cleaning demo data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.clean_my_demo_data() TO authenticated;
