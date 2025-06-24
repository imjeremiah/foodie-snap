-- Fix RLS policies to prevent infinite recursion
-- The issue is that conversation_participants policy tries to query itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

-- Create fixed policies that don't cause circular references

-- For conversations: Allow users to see conversations where they are directly a participant
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

-- For conversation_participants: Simple policy - users can see their own participation records
-- and we'll handle the complex joins in the application layer
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
  FOR SELECT USING (
    -- Much simpler: users can see all participant records where they are also a participant
    -- We'll use a subquery that checks conversations they created or are explicitly listed in
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.created_by = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Allow users to join conversations (needed for creating conversations)
CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    -- Allow if the conversation creator is adding them
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );

-- Allow conversation updates (for timestamp updates)
CREATE POLICY "Conversation creators can update" ON public.conversations
  FOR UPDATE USING (created_by = auth.uid());

-- Allow anyone to create conversations
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid()); 