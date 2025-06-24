-- Fix recursive policy issues and enable single-device testing
-- Migration 00008: Complete policy fix and seed data setup

-- First, drop ALL existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;

-- Create non-recursive conversation_participants policies
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
FOR SELECT USING (
  -- Users can see their own participation records
  user_id = auth.uid() OR
  -- Users can see other participants in conversations they are part of
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert conversation participants" ON public.conversation_participants
FOR INSERT WITH CHECK (
  -- Users can add themselves to conversations
  user_id = auth.uid() OR
  -- Conversation creators can add participants
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Drop existing conversation policies first
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Create simple conversation policies
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (
  -- Users can see conversations they created
  created_by = auth.uid() OR
  -- Users can see conversations they participate in (non-recursive check)
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their conversations" ON public.conversations
FOR UPDATE USING (created_by = auth.uid());

-- Drop existing message policies first
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;

-- Create message policies
CREATE POLICY "Users can view conversation messages" ON public.messages
FOR SELECT USING (
  -- Users can see messages in conversations they participate in
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  -- Users can send messages as themselves to conversations they're in
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- Create demo seed data function for single-device testing
CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS void AS $$
DECLARE
  demo_user_id UUID;
  friend_user_id UUID;
  conversation_id UUID;
BEGIN
  -- Get current user
  demo_user_id := auth.uid();
  
  -- Create a demo friend user (if not exists)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'demo.friend@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Get the friend user ID
  SELECT id INTO friend_user_id FROM auth.users WHERE email = 'demo.friend@example.com';
  
  -- Create friend profile
  INSERT INTO public.profiles (id, email, display_name, bio)
  VALUES (
    friend_user_id,
    'demo.friend@example.com',
    'Demo Friend',
    'Your demo chat partner for testing!'
  ) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio;
  
  -- Create friendship (accepted)
  INSERT INTO public.friends (user_id, friend_id, status)
  VALUES (demo_user_id, friend_user_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
  
  -- Create reverse friendship
  INSERT INTO public.friends (user_id, friend_id, status)
  VALUES (friend_user_id, demo_user_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted';
  
  -- Create a conversation
  INSERT INTO public.conversations (id, created_by)
  VALUES (gen_random_uuid(), demo_user_id)
  RETURNING id INTO conversation_id;
  
  -- Add participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (conversation_id, demo_user_id),
    (conversation_id, friend_user_id);
  
  -- Add some demo messages
  INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at)
  VALUES 
    (conversation_id, friend_user_id, 'Hey! Welcome to FoodieSnap! 👋', 'text', NOW() - INTERVAL '5 minutes'),
    (conversation_id, friend_user_id, 'Try sending me a message to test the chat features!', 'text', NOW() - INTERVAL '4 minutes'),
    (conversation_id, demo_user_id, 'Thanks! This is working great! 🚀', 'text', NOW() - INTERVAL '3 minutes'),
    (conversation_id, friend_user_id, 'You can also try sending a Snap with the purple button! ⚡', 'text', NOW() - INTERVAL '2 minutes');
  
  RAISE NOTICE 'Demo data seeded successfully for user: %', demo_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 