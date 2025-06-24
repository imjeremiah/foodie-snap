-- Migration 00019: Add group conversation support
-- Adds system message type and any additional group conversation features

-- Update message_type check constraint to include 'system'
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'snap', 'system'));

-- Add index on message_type for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

-- Create function to automatically clean up empty conversations after participant removal
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if conversation has any remaining participants
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = OLD.conversation_id
  ) THEN
    -- Delete all messages first
    DELETE FROM public.messages 
    WHERE conversation_id = OLD.conversation_id;
    
    -- Delete the conversation
    DELETE FROM public.conversations 
    WHERE id = OLD.conversation_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically cleanup empty conversations
DROP TRIGGER IF EXISTS cleanup_empty_conversations_trigger ON public.conversation_participants;
CREATE TRIGGER cleanup_empty_conversations_trigger
  AFTER DELETE ON public.conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_empty_conversations();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_empty_conversations() TO authenticated;

-- Update RLS policies to allow system messages
-- System messages can be inserted by any authenticated user in their conversations
CREATE POLICY "Users can insert system messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    message_type = 'system' AND
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Ensure existing policies don't conflict
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Add conversation management policies for group operations
CREATE POLICY "Users can manage conversation participants" ON public.conversation_participants
  FOR ALL USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Allow conversation creators and participants to add/remove participants
CREATE POLICY "Users can insert participants in their conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove participants from their conversations" ON public.conversation_participants
  FOR DELETE USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  ); 