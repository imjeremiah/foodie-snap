-- Enhanced messaging features: read receipts, expiration, and bulk operations
-- Migration 00007: Add database functions for messaging enhancements

-- Function to bulk update message read status
CREATE OR REPLACE FUNCTION mark_messages_as_read(message_updates JSONB[])
RETURNS void AS $$
DECLARE
  update_item JSONB;
BEGIN
  -- Loop through each message update
  FOREACH update_item IN ARRAY message_updates
  LOOP
    UPDATE public.messages 
    SET read_by = (update_item->>'read_by')::JSONB
    WHERE id = (update_item->>'id')::UUID;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired messages (disappearing messages)
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- Delete messages that have expired
  DELETE FROM public.messages 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Log cleanup for debugging
  RAISE NOTICE 'Cleaned up expired messages at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically cleanup expired messages (can be called via cron)
CREATE OR REPLACE FUNCTION auto_cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- This function can be called by a scheduled job
  PERFORM cleanup_expired_messages();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance on expires_at queries
CREATE INDEX IF NOT EXISTS idx_messages_expires_at 
ON public.messages(expires_at) 
WHERE expires_at IS NOT NULL;

-- Add index for better performance on read_by queries
CREATE INDEX IF NOT EXISTS idx_messages_read_by 
ON public.messages USING GIN(read_by);

-- Add composite index for conversation + expiration queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_expires 
ON public.messages(conversation_id, expires_at) 
WHERE expires_at IS NOT NULL; 