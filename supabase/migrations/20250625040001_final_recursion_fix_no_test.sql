-- Final Recursion Fix: Permanently eliminate ALL recursive policies (No Test Version)
-- This migration removes the problematic policies introduced in 00019_group_conversations.sql
-- and ensures only non-recursive policies remain active

-- Step 1: Temporarily disable RLS to avoid conflicts during policy changes
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL potentially problematic policies from group conversations migration
DROP POLICY IF EXISTS "Users can insert system messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can manage conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants from their conversations" ON public.conversation_participants;

-- Step 3: Drop any remaining policies that might cause recursion
DROP POLICY IF EXISTS "conversation_participants_allow_all" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversations_allow_all" ON public.conversations;
DROP POLICY IF EXISTS "messages_allow_all" ON public.messages;
DROP POLICY IF EXISTS "safe_conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "safe_conversation_participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "safe_conversation_participants_delete" ON public.conversation_participants;
DROP POLICY IF EXISTS "safe_conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "safe_conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "safe_conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "safe_conversations_delete" ON public.conversations;
DROP POLICY IF EXISTS "safe_messages_select" ON public.messages;
DROP POLICY IF EXISTS "safe_messages_insert" ON public.messages;
DROP POLICY IF EXISTS "safe_messages_update" ON public.messages;
DROP POLICY IF EXISTS "safe_messages_delete" ON public.messages;

-- Step 4: Create FINAL, SIMPLE, NON-RECURSIVE policies

-- Conversation participants policies (ultra-simple to avoid any recursion)
CREATE POLICY "final_conversation_participants_all" ON public.conversation_participants
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Conversations policies (ultra-simple to avoid any recursion)
CREATE POLICY "final_conversations_all" ON public.conversations
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Messages policies (ultra-simple to avoid any recursion, including system messages)
CREATE POLICY "final_messages_all" ON public.messages
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Re-enable RLS with the safe policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Group conversation infinite recursion fix applied successfully! 🎉' as status; 