-- Fix missing RAG function causing Edge Function 502 errors
-- This ensures the get_user_preferences_for_rag function exists and works properly

-- Drop and recreate the function to ensure it's properly defined
DROP FUNCTION IF EXISTS get_user_preferences_for_rag(UUID);

-- Function to get user preferences for RAG personalization
CREATE OR REPLACE FUNCTION get_user_preferences_for_rag(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_prefs JSONB;
BEGIN
  -- Get user preferences from profiles table
  SELECT jsonb_build_object(
    'fitness_goal', primary_fitness_goal,
    'secondary_goals', secondary_fitness_goals,
    'dietary_restrictions', dietary_restrictions,
    'allergies', allergies,
    'preferred_cuisines', preferred_cuisines,
    'content_style', preferred_content_style,
    'content_tone', content_tone_preferences,
    'meal_timing', meal_timing_preference,
    'cooking_skill', cooking_skill_level,
    'meal_prep_frequency', meal_prep_frequency,
    'calorie_goal', daily_calorie_goal,
    'protein_goal', protein_goal_grams,
    'carb_preference', carb_preference,
    'activity_level', activity_level,
    'workout_frequency', workout_frequency,
    'onboarding_completed', onboarding_completed
  ) INTO user_prefs
  FROM public.profiles
  WHERE id = user_id_param;
  
  -- Return preferences or empty object if user not found
  RETURN COALESCE(user_prefs, '{}'::jsonb);
END;
$$;

-- Ensure the get_user_rag_context function exists and works properly
DROP FUNCTION IF EXISTS get_user_rag_context(UUID);

CREATE OR REPLACE FUNCTION get_user_rag_context(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_preferences JSONB;
  recent_content JSONB;
  result JSONB;
BEGIN
  -- Get user preferences (this should now work)
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
  
  -- Combine preferences and recent content
  result := json_build_object(
    'preferences', user_preferences,
    'recent_content', recent_content,
    'context_generated_at', NOW()
  );
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_preferences_for_rag(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rag_context(UUID) TO authenticated;

-- Test the functions work by creating a simple test
DO $$
DECLARE
  test_result JSONB;
BEGIN
  -- Test get_user_preferences_for_rag with a dummy UUID
  SELECT get_user_preferences_for_rag('00000000-0000-0000-0000-000000000000') INTO test_result;
  RAISE NOTICE 'get_user_preferences_for_rag test result: %', test_result;
  
  -- Test get_user_rag_context with a dummy UUID  
  SELECT get_user_rag_context('00000000-0000-0000-0000-000000000000') INTO test_result;
  RAISE NOTICE 'get_user_rag_context test result: %', test_result;
  
  RAISE NOTICE 'RAG functions created and tested successfully!';
END;
$$; 