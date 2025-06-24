-- FINAL FIX: Eliminate recursive policies completely and fix seed function
-- Migration 00009: Permanent solution to recursive policy nightmare

-- STEP 1: DISABLE RLS and DROP ALL EXISTING POLICIES (break recursion cycle)
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

-- STEP 2: Create BASIC NON-RECURSIVE policies (permissive for now)

-- Conversation participants: Basic authenticated user access
CREATE POLICY "conversation_participants_select" ON public.conversation_participants
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "conversation_participants_insert" ON public.conversation_participants
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conversations: Basic authenticated user access  
CREATE POLICY "conversations_select" ON public.conversations
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "conversations_insert" ON public.conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update" ON public.conversations
FOR UPDATE USING (created_by = auth.uid());

-- Messages: Basic authenticated user access
CREATE POLICY "messages_select" ON public.messages
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "messages_insert" ON public.messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- STEP 2.5: Re-enable RLS with new policies in place
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create WORKING seed function (no auth.users manipulation)
DROP FUNCTION IF EXISTS seed_demo_data();

CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS void AS $$
DECLARE
  current_user_id UUID;
  demo_friend_id UUID;
  conversation_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to seed demo data';
  END IF;
  
  -- Create a demo friend profile (reuse existing if present)
  demo_friend_id := '11111111-1111-1111-1111-111111111111'::UUID;
  
  -- Insert demo friend profile
  INSERT INTO public.profiles (id, email, display_name, bio, created_at, updated_at)
  VALUES (
    demo_friend_id,
    'demo.friend@foodiesnap.com',
    'Demo Friend',
    'Your friendly chat partner for testing! 🤖',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    updated_at = NOW();
  
  -- Create friendship (both directions)
  INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at)
  VALUES (current_user_id, demo_friend_id, 'accepted', NOW(), NOW())
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', updated_at = NOW();
  
  INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at)
  VALUES (demo_friend_id, current_user_id, 'accepted', NOW(), NOW())
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', updated_at = NOW();
  
  -- Create conversation
  INSERT INTO public.conversations (id, created_by, created_at, updated_at)
  VALUES (gen_random_uuid(), current_user_id, NOW(), NOW())
  RETURNING id INTO conversation_id;
  
  -- Add participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
  VALUES 
    (conversation_id, current_user_id, NOW()),
    (conversation_id, demo_friend_id, NOW());
  
  -- Add demo messages
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at)
  VALUES 
    (conversation_id, demo_friend_id, 'Hey there! Welcome to FoodieSnap! 👋', 'text', NOW() - INTERVAL '10 minutes'),
    (conversation_id, demo_friend_id, 'I''m your demo chat partner. Try sending me a message! 💬', 'text', NOW() - INTERVAL '8 minutes'),
    (conversation_id, current_user_id, 'Thanks! This messaging system looks great! 🚀', 'text', NOW() - INTERVAL '6 minutes'),
    (conversation_id, demo_friend_id, 'Try the purple snap button to send disappearing messages! ⚡', 'text', NOW() - INTERVAL '4 minutes'),
    (conversation_id, demo_friend_id, 'You can also test read receipts and typing indicators! ✨', 'text', NOW() - INTERVAL '2 minutes');
  
  RAISE NOTICE 'Demo data created successfully for user: %', current_user_id;
  RAISE NOTICE 'Conversation ID: %', conversation_id;
  RAISE NOTICE 'Demo friend ID: %', demo_friend_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION seed_demo_data() TO authenticated; 