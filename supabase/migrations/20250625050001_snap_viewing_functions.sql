-- Snap Viewing Functions Migration
-- This migration adds the database functions needed for the enhanced snap viewing experience

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS record_snap_view;
DROP FUNCTION IF EXISTS increment_snap_replay;
DROP FUNCTION IF EXISTS record_snap_screenshot;

-- Function to record a snap view
CREATE OR REPLACE FUNCTION record_snap_view(
  message_id_param UUID,
  viewer_id_param UUID,
  viewing_started_at_param TIMESTAMP WITH TIME ZONE,
  is_replay_param BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  snap_record RECORD;
  current_view_count INTEGER;
  current_replay_count INTEGER;
  can_view BOOLEAN;
  result JSON;
BEGIN
  -- Get the snap message details
  SELECT * INTO snap_record
  FROM messages 
  WHERE id = message_id_param 
    AND message_type = 'snap';
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Snap message not found'
    );
  END IF;
  
  -- Check if snap has expired
  IF snap_record.expires_at IS NOT NULL AND snap_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Snap has expired'
    );
  END IF;
  
  -- Initialize viewed_by if null
  IF snap_record.viewed_by IS NULL THEN
    snap_record.viewed_by := '{}'::jsonb;
  END IF;
  
  -- Get current view data for this viewer
  current_view_count := COALESCE(
    (snap_record.viewed_by -> viewer_id_param::text ->> 'view_count')::integer, 
    0
  );
  current_replay_count := COALESCE(
    (snap_record.viewed_by -> viewer_id_param::text ->> 'replay_count')::integer, 
    0
  );
  
  -- Check if user can view (first time or has replays left)
  can_view := current_view_count = 0 OR 
              (current_replay_count < COALESCE(snap_record.max_replays, 1));
  
  IF NOT can_view THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No more replays available'
    );
  END IF;
  
  -- Update view data
  IF is_replay_param THEN
    current_replay_count := current_replay_count + 1;
  ELSE
    current_view_count := current_view_count + 1;
  END IF;
  
  -- Update the message with view data
  UPDATE messages 
  SET viewed_by = snap_record.viewed_by || 
    jsonb_build_object(
      viewer_id_param::text,
      jsonb_build_object(
        'view_count', current_view_count,
        'replay_count', current_replay_count,
        'first_viewed_at', COALESCE(
          snap_record.viewed_by -> viewer_id_param::text ->> 'first_viewed_at',
          viewing_started_at_param::text
        ),
        'last_viewed_at', viewing_started_at_param::text
      )
    )
  WHERE id = message_id_param;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'replay_count', current_replay_count,
    'can_replay', current_replay_count < COALESCE(snap_record.max_replays, 1)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment snap replay count
CREATE OR REPLACE FUNCTION increment_snap_replay(
  message_id_param UUID,
  viewer_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  snap_record RECORD;
  current_replay_count INTEGER;
  max_replays INTEGER;
  result JSON;
BEGIN
  -- Get the snap message details
  SELECT * INTO snap_record
  FROM messages 
  WHERE id = message_id_param 
    AND message_type = 'snap';
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Snap message not found'
    );
  END IF;
  
  -- Check if snap has expired
  IF snap_record.expires_at IS NOT NULL AND snap_record.expires_at < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Snap has expired'
    );
  END IF;
  
  -- Initialize viewed_by if null
  IF snap_record.viewed_by IS NULL THEN
    snap_record.viewed_by := '{}'::jsonb;
  END IF;
  
  -- Get current replay count
  current_replay_count := COALESCE(
    (snap_record.viewed_by -> viewer_id_param::text ->> 'replay_count')::integer, 
    0
  );
  max_replays := COALESCE(snap_record.max_replays, 1);
  
  -- Check if user can replay
  IF current_replay_count >= max_replays THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No more replays available'
    );
  END IF;
  
  -- Increment replay count
  current_replay_count := current_replay_count + 1;
  
  -- Update the message with new replay count
  UPDATE messages 
  SET viewed_by = snap_record.viewed_by || 
    jsonb_build_object(
      viewer_id_param::text,
      COALESCE(snap_record.viewed_by -> viewer_id_param::text, '{}'::jsonb) ||
      jsonb_build_object(
        'replay_count', current_replay_count,
        'last_replayed_at', NOW()::text
      )
    )
  WHERE id = message_id_param;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'replay_count', current_replay_count,
    'can_replay', current_replay_count < max_replays
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record screenshot detection
CREATE OR REPLACE FUNCTION record_snap_screenshot(
  message_id_param UUID,
  screenshotter_id_param UUID,
  screenshot_timestamp_param TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
DECLARE
  snap_record RECORD;
BEGIN
  -- Get the snap message details
  SELECT * INTO snap_record
  FROM messages 
  WHERE id = message_id_param 
    AND message_type = 'snap';
    
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Initialize screenshot_by if null
  IF snap_record.screenshot_by IS NULL THEN
    snap_record.screenshot_by := '{}'::jsonb;
  END IF;
  
  -- Update the message with screenshot data
  UPDATE messages 
  SET screenshot_by = snap_record.screenshot_by || 
    jsonb_build_object(
      screenshotter_id_param::text,
      screenshot_timestamp_param::text
    )
  WHERE id = message_id_param;
  
  -- Optionally, you could add a notification to the sender here
  -- For example, insert into a notifications table
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_snap_view TO authenticated;
GRANT EXECUTE ON FUNCTION increment_snap_replay TO authenticated;
GRANT EXECUTE ON FUNCTION record_snap_screenshot TO authenticated;

-- Success message
SELECT 'Enhanced snap viewing functions created successfully! 🎬' as status; 