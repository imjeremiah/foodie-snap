-- Migration for Phase 2.1 Step 10: Enhanced Snap Experience
-- Adds snap viewing, replay, and screenshot detection functionality

-- Add columns to messages table for snap viewing tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '{}', -- user_id -> { timestamp, replay_count }
ADD COLUMN IF NOT EXISTS screenshot_by JSONB DEFAULT '{}', -- user_id -> timestamp when screenshot was taken
ADD COLUMN IF NOT EXISTS max_replays INTEGER DEFAULT 1, -- How many times this snap can be replayed
ADD COLUMN IF NOT EXISTS viewing_duration INTEGER DEFAULT 5; -- How long the snap should be displayed (seconds)

-- Create index for efficient queries on viewed_by and screenshot_by
CREATE INDEX IF NOT EXISTS idx_messages_viewed_by ON public.messages USING GIN (viewed_by);
CREATE INDEX IF NOT EXISTS idx_messages_screenshot_by ON public.messages USING GIN (screenshot_by);

-- Function to record snap view
CREATE OR REPLACE FUNCTION record_snap_view(
  message_id_param UUID,
  viewer_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  current_viewed JSONB;
  current_view_data JSONB;
  new_view_data JSONB;
  can_view BOOLEAN DEFAULT TRUE;
  result JSON;
BEGIN
  -- Get current viewed_by data
  SELECT viewed_by INTO current_viewed
  FROM public.messages
  WHERE id = message_id_param;
  
  -- Check if user has already viewed this snap
  current_view_data := current_viewed -> viewer_id_param::TEXT;
  
  -- If no previous view data, create new entry
  IF current_view_data IS NULL THEN
    new_view_data := jsonb_build_object(
      'timestamp', NOW(),
      'replay_count', 0,
      'first_viewed_at', NOW()
    );
  ELSE
    -- Check if user has exceeded replay limit
    IF (current_view_data->>'replay_count')::INTEGER >= (
      SELECT max_replays FROM public.messages WHERE id = message_id_param
    ) THEN
      can_view := FALSE;
    ELSE
      -- Increment replay count
      new_view_data := current_view_data || jsonb_build_object(
        'timestamp', NOW(),
        'replay_count', (current_view_data->>'replay_count')::INTEGER + 1
      );
    END IF;
  END IF;
  
  -- Update the message if viewing is allowed
  IF can_view THEN
    UPDATE public.messages
    SET viewed_by = viewed_by || jsonb_build_object(viewer_id_param::TEXT, new_view_data)
    WHERE id = message_id_param;
    
    result := json_build_object(
      'success', true,
      'replay_count', (new_view_data->>'replay_count')::INTEGER,
      'can_replay', (new_view_data->>'replay_count')::INTEGER < (
        SELECT max_replays FROM public.messages WHERE id = message_id_param
      )
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Maximum replays exceeded'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record screenshot notification
CREATE OR REPLACE FUNCTION record_screenshot(
  message_id_param UUID,
  screenshotter_id_param UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update the message with screenshot information
  UPDATE public.messages
  SET screenshot_by = screenshot_by || jsonb_build_object(
    screenshotter_id_param::TEXT, NOW()
  )
  WHERE id = message_id_param;
  
  -- TODO: In the future, we could send a push notification to the sender here
  -- For now, the app will check this data to show screenshot notifications
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a snap can be viewed/replayed
CREATE OR REPLACE FUNCTION can_view_snap(
  message_id_param UUID,
  viewer_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  message_data RECORD;
  view_data JSONB;
  result JSON;
BEGIN
  -- Get message and view data
  SELECT * INTO message_data
  FROM public.messages
  WHERE id = message_id_param;
  
  -- Check if message exists and is a snap
  IF message_data IS NULL OR message_data.message_type != 'snap' THEN
    RETURN json_build_object('can_view', false, 'error', 'Invalid snap message');
  END IF;
  
  -- Check if snap has expired
  IF message_data.expires_at IS NOT NULL AND message_data.expires_at < NOW() THEN
    RETURN json_build_object('can_view', false, 'error', 'Snap has expired');
  END IF;
  
  -- Get user's view data
  view_data := message_data.viewed_by -> viewer_id_param::TEXT;
  
  -- If never viewed, can view
  IF view_data IS NULL THEN
    RETURN json_build_object(
      'can_view', true,
      'is_first_view', true,
      'replay_count', 0,
      'max_replays', message_data.max_replays,
      'viewing_duration', message_data.viewing_duration
    );
  END IF;
  
  -- Check replay limit
  IF (view_data->>'replay_count')::INTEGER >= message_data.max_replays THEN
    RETURN json_build_object(
      'can_view', false,
      'error', 'Maximum replays exceeded',
      'replay_count', (view_data->>'replay_count')::INTEGER,
      'max_replays', message_data.max_replays
    );
  END IF;
  
  -- Can replay
  RETURN json_build_object(
    'can_view', true,
    'is_first_view', false,
    'replay_count', (view_data->>'replay_count')::INTEGER,
    'max_replays', message_data.max_replays,
    'viewing_duration', message_data.viewing_duration
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get screenshot notifications for a user
CREATE OR REPLACE FUNCTION get_screenshot_notifications(
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  notifications JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'message_id', m.id,
      'conversation_id', m.conversation_id,
      'content_preview', LEFT(COALESCE(m.content, 'Photo'), 30),
      'screenshot_by', screenshot_data.user_id,
      'screenshot_at', screenshot_data.timestamp,
      'screenshotter_name', p.display_name
    )
  ) INTO notifications
  FROM public.messages m
  CROSS JOIN LATERAL (
    SELECT key as user_id, value as timestamp
    FROM jsonb_each_text(m.screenshot_by)
  ) screenshot_data
  JOIN public.profiles p ON p.id = screenshot_data.user_id::UUID
  WHERE m.sender_id = user_id_param
    AND m.message_type = 'snap'
    AND m.screenshot_by IS NOT NULL
    AND jsonb_object_keys(m.screenshot_by) IS NOT NULL
  ORDER BY (screenshot_data.timestamp)::TIMESTAMP DESC
  LIMIT 50;
  
  RETURN COALESCE(notifications, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for viewing snap view data
CREATE POLICY "Users can view snap data for their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION record_snap_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_screenshot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_snap(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_screenshot_notifications(UUID) TO authenticated; 