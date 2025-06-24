-- Fix infinite recursion in conversation_participants policies
-- The issue is that the policy is referencing itself, causing a loop

-- Drop the problematic policy first
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
FOR SELECT USING (
  -- Users can see participants in conversations they created
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  ) OR
  -- Users can see their own participation records
  user_id = auth.uid()
); 