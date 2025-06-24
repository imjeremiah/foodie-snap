-- Migration 00010: Add conversation management features
-- Adds support for archiving conversations and better message tracking

-- Add archived_by column to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS archived_by JSONB DEFAULT '[]'::jsonb;

-- Add index for archived_by for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_archived_by ON public.conversations USING GIN (archived_by);

-- Create function to get unread message count for a conversation and user
CREATE OR REPLACE FUNCTION get_unread_count(conv_id UUID, user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages
    WHERE conversation_id = conv_id
    AND sender_id != user_id
    AND NOT (read_by ? user_id::text)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark messages as read (bulk operation)
CREATE OR REPLACE FUNCTION mark_messages_as_read(message_updates JSONB)
RETURNS void AS $$
DECLARE
  update_item JSONB;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(message_updates)
  LOOP
    UPDATE public.messages
    SET read_by = (update_item->>'read_by')::jsonb
    WHERE id = (update_item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversation last message time
CREATE OR REPLACE FUNCTION get_last_message_time(conv_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN (
    SELECT COALESCE(MAX(created_at), '1970-01-01'::timestamp with time zone)
    FROM public.messages
    WHERE conversation_id = conv_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.messages
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for authenticated users
GRANT EXECUTE ON FUNCTION get_unread_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_message_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_messages() TO authenticated;

-- Create view for conversations with computed fields for better performance
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
  c.*,
  get_last_message_time(c.id) as last_message_time,
  (
    SELECT content
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message_content,
  (
    SELECT message_type
    FROM public.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message_type
FROM public.conversations c;

-- Grant access to the view
GRANT SELECT ON conversation_details TO authenticated;

-- Note: RLS is handled by the underlying conversations table
-- Views inherit RLS from their underlying tables 