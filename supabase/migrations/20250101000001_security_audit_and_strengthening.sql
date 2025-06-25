-- Security Audit and RLS Policy Strengthening Migration
-- Phase 2.1 Step 15: Comprehensive security and privacy enhancements
-- This migration audits and strengthens all RLS policies with additional security measures

-- ========================================
-- SECURITY POLICY AUDIT AND STRENGTHENING
-- ========================================

-- Drop and recreate stronger RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Enhanced profile policies with blocking consideration
CREATE POLICY "Users can view non-blocked profiles" ON public.profiles
  FOR SELECT USING (
    -- Users can see their own profile
    auth.uid() = id OR
    -- Users can see profiles of people who haven't blocked them
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = id AND blocked_id = auth.uid()
    )
  );

CREATE POLICY "Users can update only their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert only their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- ENHANCED FRIENDS TABLE SECURITY
-- ========================================

-- Drop existing friend policies and create more secure ones
DROP POLICY IF EXISTS "Users can view their friends" ON public.friends;
DROP POLICY IF EXISTS "Users can manage their friend requests" ON public.friends;

-- Enhanced friend policies with additional security checks
CREATE POLICY "Users can view their friend relationships" ON public.friends
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

CREATE POLICY "Users can create friend requests securely" ON public.friends
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent self-friending
    user_id != friend_id AND
    -- Prevent duplicate requests
    NOT EXISTS (
      SELECT 1 FROM public.friends 
      WHERE user_id = NEW.user_id AND friend_id = NEW.friend_id
    ) AND
    -- Prevent friending blocked users
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = NEW.user_id AND blocked_id = NEW.friend_id) OR
            (blocker_id = NEW.friend_id AND blocked_id = NEW.user_id)
    )
  );

CREATE POLICY "Users can update their own friend requests" ON public.friends
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend relationships" ON public.friends
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ========================================
-- ENHANCED CONVERSATION SECURITY
-- ========================================

-- Create a more secure conversation access function
CREATE OR REPLACE FUNCTION user_can_access_conversation(conversation_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a participant
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced conversation policies
DROP POLICY IF EXISTS "final_conversations_all" ON public.conversations;

CREATE POLICY "Users can view accessible conversations" ON public.conversations
  FOR SELECT USING (
    user_can_access_conversation(id, auth.uid())
  );

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    created_by = auth.uid() OR
    user_can_access_conversation(id, auth.uid())
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- ========================================
-- ENHANCED MESSAGE SECURITY
-- ========================================

-- Enhanced message policies with expiration and blocking checks
DROP POLICY IF EXISTS "final_messages_all" ON public.messages;

CREATE POLICY "Users can view accessible messages" ON public.messages
  FOR SELECT USING (
    user_can_access_conversation(conversation_id, auth.uid()) AND
    -- Check if message hasn't expired (for disappearing messages)
    (expires_at IS NULL OR expires_at > NOW()) AND
    -- Check if sender hasn't been blocked
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = auth.uid() AND blocked_id = sender_id
    )
  );

CREATE POLICY "Users can insert messages to accessible conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    user_can_access_conversation(conversation_id, auth.uid()) AND
    -- Rate limiting check (prevent spam)
    (
      SELECT COUNT(*) FROM public.messages
      WHERE sender_id = auth.uid() 
      AND created_at > NOW() - INTERVAL '1 minute'
    ) < 50
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    user_can_access_conversation(conversation_id, auth.uid())
  );

-- ========================================
-- ENHANCED SPOTLIGHT SECURITY
-- ========================================

-- Enhanced spotlight post policies with content moderation
DROP POLICY IF EXISTS "Users can view public approved posts" ON public.spotlight_posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.spotlight_posts;

CREATE POLICY "Users can view safe public posts" ON public.spotlight_posts
  FOR SELECT USING (
    -- Own posts (always visible)
    user_id = auth.uid() OR
    (
      -- Public approved posts from non-blocked users
      is_public = true AND 
      is_approved = true AND 
      is_flagged = false AND
      NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE blocker_id = auth.uid() AND blocked_id = user_id
      ) AND
      -- Respect audience restrictions
      (
        audience_restriction = 'public' OR
        (audience_restriction = 'friends' AND user_id IN (
          SELECT friend_id FROM public.friends 
          WHERE user_id = auth.uid() AND status = 'accepted'
        ))
      )
    )
  );

-- ========================================
-- ENHANCED JOURNAL SECURITY
-- ========================================

-- Enhanced journal entry policies
CREATE POLICY "Users can only access their own journal" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ENHANCED STORIES SECURITY
-- ========================================

-- Enhanced stories policies with expiration and friendship checks
DROP POLICY IF EXISTS "Users can view stories from friends and themselves" ON public.stories;

CREATE POLICY "Users can view accessible stories" ON public.stories
  FOR SELECT USING (
    -- Own stories
    user_id = auth.uid() OR
    (
      -- Friends' stories that haven't expired
      expires_at > NOW() AND
      user_id IN (
        SELECT friend_id FROM public.friends 
        WHERE user_id = auth.uid() AND status = 'accepted'
      ) AND
      -- Not from blocked users
      NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE blocker_id = auth.uid() AND blocked_id = user_id
      )
    )
  );

-- ========================================
-- CONTENT MODERATION FUNCTIONS
-- ========================================

-- Function to report inappropriate content
CREATE OR REPLACE FUNCTION report_content(
  content_type TEXT,
  content_id UUID,
  report_reason TEXT,
  description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
BEGIN
  -- Validate inputs
  IF content_type NOT IN ('spotlight_post', 'message', 'story', 'profile') THEN
    RAISE EXCEPTION 'Invalid content type';
  END IF;
  
  IF report_reason NOT IN ('inappropriate', 'spam', 'harassment', 'copyright', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason';
  END IF;
  
  -- Insert report (generic reporting table could be created for all content types)
  INSERT INTO public.content_reports (
    id,
    content_type,
    content_id,
    reporter_id,
    report_reason,
    description,
    created_at
  ) VALUES (
    gen_random_uuid(),
    content_type,
    content_id,
    auth.uid(),
    report_reason,
    description,
    NOW()
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create content reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('spotlight_post', 'message', 'story', 'profile')),
  content_id UUID NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_reason TEXT NOT NULL CHECK (report_reason IN ('inappropriate', 'spam', 'harassment', 'copyright', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports
  UNIQUE(content_type, content_id, reporter_id)
);

-- Enable RLS on content reports
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ========================================
-- DATA EXPORT AND DELETION FUNCTIONS
-- ========================================

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
BEGIN
  -- Only allow users to export their own data
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'You can only export your own data';
  END IF;
  
  SELECT jsonb_build_object(
    'profile', (
      SELECT to_jsonb(p.*) FROM public.profiles p WHERE id = user_id_param
    ),
    'friends', (
      SELECT jsonb_agg(to_jsonb(f.*))
      FROM public.friends f
      WHERE user_id = user_id_param OR friend_id = user_id_param
    ),
    'messages', (
      SELECT jsonb_agg(to_jsonb(m.*))
      FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = user_id_param
    ),
    'journal_entries', (
      SELECT jsonb_agg(to_jsonb(j.*))
      FROM public.journal_entries j
      WHERE user_id = user_id_param
    ),
    'spotlight_posts', (
      SELECT jsonb_agg(to_jsonb(s.*))
      FROM public.spotlight_posts s
      WHERE user_id = user_id_param
    ),
    'stories', (
      SELECT jsonb_agg(to_jsonb(st.*))
      FROM public.stories st
      WHERE user_id = user_id_param
    ),
    'user_preferences', (
      SELECT to_jsonb(up.*) FROM public.user_preferences up WHERE user_id = user_id_param
    ),
    'export_timestamp', NOW()
  ) INTO user_data;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user data (GDPR compliance)
CREATE OR REPLACE FUNCTION delete_user_data(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow users to delete their own data
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own data';
  END IF;
  
  -- Delete in order to respect foreign key constraints
  DELETE FROM public.blocked_users WHERE blocker_id = user_id_param OR blocked_id = user_id_param;
  DELETE FROM public.friends WHERE user_id = user_id_param OR friend_id = user_id_param;
  DELETE FROM public.spotlight_reactions WHERE user_id = user_id_param;
  DELETE FROM public.spotlight_reports WHERE reporter_id = user_id_param;
  DELETE FROM public.spotlight_posts WHERE user_id = user_id_param;
  DELETE FROM public.stories WHERE user_id = user_id_param;
  DELETE FROM public.journal_entries WHERE user_id = user_id_param;
  DELETE FROM public.user_preferences WHERE user_id = user_id_param;
  DELETE FROM public.user_stats WHERE user_id = user_id_param;
  
  -- Delete messages (this might affect other users' conversations)
  UPDATE public.messages SET content = '[deleted]', image_url = NULL 
  WHERE sender_id = user_id_param;
  
  -- Remove from conversation participants
  DELETE FROM public.conversation_participants WHERE user_id = user_id_param;
  
  -- Finally delete profile
  DELETE FROM public.profiles WHERE id = user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY AUDIT FUNCTIONS
-- ========================================

-- Function to audit RLS policies
CREATE OR REPLACE FUNCTION audit_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER,
  has_select_policy BOOLEAN,
  has_insert_policy BOOLEAN,
  has_update_policy BOOLEAN,
  has_delete_policy BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname)::INTEGER,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'r') > 0,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'a') > 0,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'w') > 0,
    COUNT(p.policyname) FILTER (WHERE p.cmd = 'd') > 0
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY MONITORING
-- ========================================

-- Create security events log table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security events (only viewable by system)
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type_param TEXT,
  details_param JSONB DEFAULT NULL,
  ip_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    event_type_param,
    auth.uid(),
    details_param,
    ip_param,
    user_agent_param
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION user_can_access_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION report_content(TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, JSONB, INET, TEXT) TO authenticated;

-- ========================================
-- SECURITY COMPLETION
-- ========================================

-- Log completion of security audit
SELECT log_security_event(
  'security_audit_completed',
  jsonb_build_object(
    'migration', '20250101000001_security_audit_and_strengthening',
    'timestamp', NOW(),
    'policies_updated', true
  )
);

-- Success message
SELECT 'Security audit and RLS policy strengthening completed successfully! 🔒' as status; 