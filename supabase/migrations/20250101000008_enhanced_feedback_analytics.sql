-- Enhanced AI Feedback Analytics and RAG Integration
-- Phase 3, Step 4: Learning Feedback Loop & Analytics

-- Function to get comprehensive AI feedback analytics for a user
CREATE OR REPLACE FUNCTION get_ai_feedback_analytics(
  user_id_param UUID DEFAULT auth.uid(),
  time_range_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_result JSONB;
  total_feedback INTEGER;
  positive_feedback INTEGER;
  negative_feedback INTEGER;
  edited_feedback INTEGER;
  feedback_by_type JSONB;
  trend_data JSONB;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set cutoff date
  cutoff_date := NOW() - INTERVAL '1 day' * time_range_days;
  
  -- Get total feedback count
  SELECT COUNT(*) INTO total_feedback
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND created_at >= cutoff_date;
  
  -- Get positive feedback count
  SELECT COUNT(*) INTO positive_feedback
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'thumbs_up'
    AND created_at >= cutoff_date;
  
  -- Get negative feedback count
  SELECT COUNT(*) INTO negative_feedback
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'thumbs_down'
    AND created_at >= cutoff_date;
  
  -- Get edited feedback count
  SELECT COUNT(*) INTO edited_feedback
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'edited'
    AND created_at >= cutoff_date;
  
  -- Get feedback breakdown by suggestion type
  SELECT COALESCE(
    json_object_agg(
      suggestion_type,
      json_build_object(
        'total', total_count,
        'positive', positive_count,
        'negative', negative_count,
        'edited', edited_count,
        'success_rate', CASE 
          WHEN total_count > 0 THEN ROUND((positive_count::FLOAT / total_count::FLOAT) * 100, 1)
          ELSE 0 
        END
      )
    ),
    '{}'::jsonb
  ) INTO feedback_by_type
  FROM (
    SELECT 
      suggestion_type,
      COUNT(*) as total_count,
      SUM(CASE WHEN feedback_type = 'thumbs_up' THEN 1 ELSE 0 END) as positive_count,
      SUM(CASE WHEN feedback_type = 'thumbs_down' THEN 1 ELSE 0 END) as negative_count,
      SUM(CASE WHEN feedback_type = 'edited' THEN 1 ELSE 0 END) as edited_count
    FROM ai_feedback 
    WHERE user_id = user_id_param 
      AND created_at >= cutoff_date
    GROUP BY suggestion_type
  ) grouped_feedback;
  
  -- Get trend data (weekly breakdown for the last 4 weeks)
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'week', week_start,
        'total', week_total,
        'positive', week_positive,
        'success_rate', CASE 
          WHEN week_total > 0 THEN ROUND((week_positive::FLOAT / week_total::FLOAT) * 100, 1)
          ELSE 0 
        END
      ) ORDER BY week_start
    ),
    '[]'::json
  ) INTO trend_data
  FROM (
    SELECT 
      date_trunc('week', created_at) as week_start,
      COUNT(*) as week_total,
      SUM(CASE WHEN feedback_type = 'thumbs_up' THEN 1 ELSE 0 END) as week_positive
    FROM ai_feedback 
    WHERE user_id = user_id_param 
      AND created_at >= NOW() - INTERVAL '4 weeks'
    GROUP BY date_trunc('week', created_at)
    ORDER BY week_start
  ) weekly_data;
  
  -- Build final analytics result
  analytics_result := json_build_object(
    'total_feedback', total_feedback,
    'positive_feedback', positive_feedback,
    'negative_feedback', negative_feedback,
    'edited_feedback', edited_feedback,
    'positive_rate', CASE 
      WHEN total_feedback > 0 THEN ROUND((positive_feedback::FLOAT / total_feedback::FLOAT) * 100, 1)
      ELSE 0 
    END,
    'negative_rate', CASE 
      WHEN total_feedback > 0 THEN ROUND((negative_feedback::FLOAT / total_feedback::FLOAT) * 100, 1)
      ELSE 0 
    END,
    'edited_rate', CASE 
      WHEN total_feedback > 0 THEN ROUND((edited_feedback::FLOAT / total_feedback::FLOAT) * 100, 1)
      ELSE 0 
    END,
    'feedback_by_type', feedback_by_type,
    'trend_data', trend_data,
    'time_range_days', time_range_days,
    'generated_at', NOW()
  );
  
  RETURN analytics_result;
END;
$$;

-- Function to get user's content preferences based on feedback patterns
CREATE OR REPLACE FUNCTION get_user_content_preferences_from_feedback(
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  preferences_result JSONB;
  liked_suggestions TEXT[];
  disliked_suggestions TEXT[];
  editing_patterns JSONB;
BEGIN
  -- Get liked suggestions (with high confidence)
  SELECT array_agg(original_suggestion) INTO liked_suggestions
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'thumbs_up'
    AND created_at >= NOW() - INTERVAL '90 days'
  LIMIT 20;
  
  -- Get disliked suggestions
  SELECT array_agg(original_suggestion) INTO disliked_suggestions
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'thumbs_down'
    AND created_at >= NOW() - INTERVAL '90 days'
  LIMIT 20;
  
  -- Analyze editing patterns
  SELECT COALESCE(
    json_object_agg(
      suggestion_type,
      json_build_object(
        'common_edits', array_agg(edited_version),
        'edit_frequency', COUNT(*),
        'avg_edit_length', AVG(LENGTH(edited_version))
      )
    ),
    '{}'::jsonb
  ) INTO editing_patterns
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND feedback_type = 'edited'
    AND edited_version IS NOT NULL
    AND created_at >= NOW() - INTERVAL '90 days'
  GROUP BY suggestion_type;
  
  -- Build preferences result
  preferences_result := json_build_object(
    'liked_suggestions', COALESCE(liked_suggestions, ARRAY[]::TEXT[]),
    'disliked_suggestions', COALESCE(disliked_suggestions, ARRAY[]::TEXT[]),
    'editing_patterns', editing_patterns,
    'generated_at', NOW(),
    'data_span_days', 90
  );
  
  RETURN preferences_result;
END;
$$;

-- Enhanced function to get user RAG context with feedback integration
CREATE OR REPLACE FUNCTION get_user_rag_context_enhanced(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_preferences JSONB;
  recent_content JSONB;
  feedback_preferences JSONB;
  analytics_summary JSONB;
  result JSONB;
BEGIN
  -- Get basic user preferences
  SELECT get_user_preferences_for_rag(user_id_param) INTO user_preferences;
  
  -- Get recent journal entries for context
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'caption', je.caption,
        'content_type', je.content_type,
        'tags', je.tags,
        'created_at', je.created_at
      ) ORDER BY je.created_at DESC
    ), 
    '[]'::json
  ) INTO recent_content
  FROM public.journal_entries je
  WHERE je.user_id = user_id_param
    AND je.created_at > NOW() - INTERVAL '30 days'
  LIMIT 20;
  
  -- Get feedback-derived preferences
  SELECT get_user_content_preferences_from_feedback(user_id_param) INTO feedback_preferences;
  
  -- Get quick analytics summary
  SELECT json_build_object(
    'total_feedback', COUNT(*),
    'recent_positive_rate', ROUND(
      (SUM(CASE WHEN feedback_type = 'thumbs_up' THEN 1 ELSE 0 END)::FLOAT / 
       GREATEST(COUNT(*), 1)::FLOAT) * 100, 1
    ),
    'most_improved_type', (
      SELECT suggestion_type 
      FROM ai_feedback 
      WHERE user_id = user_id_param 
        AND created_at >= NOW() - INTERVAL '7 days'
        AND feedback_type = 'thumbs_up'
      GROUP BY suggestion_type 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    )
  ) INTO analytics_summary
  FROM ai_feedback 
  WHERE user_id = user_id_param 
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Combine all context
  result := json_build_object(
    'preferences', user_preferences,
    'recent_content', recent_content,
    'feedback_preferences', feedback_preferences,
    'analytics_summary', analytics_summary,
    'context_generated_at', NOW(),
    'context_version', '2.0_with_feedback'
  );
  
  RETURN result;
END;
$$;

-- Function to record AI suggestion for later feedback tracking
CREATE OR REPLACE FUNCTION record_ai_suggestion(
  suggestion_type_param TEXT,
  suggestion_id_param TEXT,
  original_suggestion_param TEXT,
  context_metadata_param JSONB DEFAULT '{}',
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_id UUID;
BEGIN
  -- This function can be used to track suggestions before feedback
  -- For now, we'll just return a UUID for the suggestion
  -- In a more complex system, we might store pending suggestions
  
  SELECT gen_random_uuid() INTO record_id;
  
  RETURN record_id;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_ai_feedback_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_content_preferences_from_feedback(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rag_context_enhanced(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_ai_suggestion(TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS ai_feedback_analytics_idx 
ON public.ai_feedback(user_id, suggestion_type, feedback_type, created_at);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS ai_feedback_time_idx 
ON public.ai_feedback(user_id, created_at DESC) 
WHERE created_at >= NOW() - INTERVAL '1 year'; 