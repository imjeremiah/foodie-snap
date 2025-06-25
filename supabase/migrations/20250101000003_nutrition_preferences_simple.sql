-- Simple migration: Add nutrition-focused user preferences for RAG personalization
-- This supports Phase 3: Enhanced User Preferences & Onboarding

-- Add nutrition-specific columns to profiles table (one by one)
-- Fitness Goals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_fitness_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_fitness_goals TEXT[] DEFAULT '{}';

-- Dietary Preferences & Restrictions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_cuisines TEXT[] DEFAULT '{}';

-- Content Style Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_content_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS content_tone_preferences TEXT[] DEFAULT '{}';

-- Meal & Cooking Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS meal_timing_preference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cooking_skill_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS meal_prep_frequency TEXT;

-- Nutrition Goals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_calorie_goal INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS protein_goal_grams INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS carb_preference TEXT;

-- Activity Level
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_frequency TEXT;

-- Onboarding Status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add check constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_primary_fitness_goal_check 
  CHECK (primary_fitness_goal IS NULL OR primary_fitness_goal IN ('muscle_gain', 'fat_loss', 'clean_eating', 'maintenance', 'athletic_performance', 'general_health'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferred_content_style_check 
  CHECK (preferred_content_style IS NULL OR preferred_content_style IN ('inspirational', 'scientific', 'quick_easy', 'humorous', 'detailed', 'casual'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_meal_timing_preference_check 
  CHECK (meal_timing_preference IS NULL OR meal_timing_preference IN ('early_bird', 'standard', 'night_owl', 'flexible', 'intermittent_fasting'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_cooking_skill_level_check 
  CHECK (cooking_skill_level IS NULL OR cooking_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_meal_prep_frequency_check 
  CHECK (meal_prep_frequency IS NULL OR meal_prep_frequency IN ('daily', 'weekly', 'bi_weekly', 'monthly', 'rarely'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_carb_preference_check 
  CHECK (carb_preference IS NULL OR carb_preference IN ('low_carb', 'moderate_carb', 'high_carb', 'flexible'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_activity_level_check 
  CHECK (activity_level IS NULL OR activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_workout_frequency_check 
  CHECK (workout_frequency IS NULL OR workout_frequency IN ('never', '1-2_per_week', '3-4_per_week', '5-6_per_week', 'daily'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_fitness_goal ON public.profiles(primary_fitness_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_dietary_restrictions ON public.profiles USING GIN(dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

-- Function to update preferences timestamp
CREATE OR REPLACE FUNCTION update_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp when any preference field changes
  IF (OLD.primary_fitness_goal IS DISTINCT FROM NEW.primary_fitness_goal OR
      OLD.dietary_restrictions IS DISTINCT FROM NEW.dietary_restrictions OR
      OLD.preferred_content_style IS DISTINCT FROM NEW.preferred_content_style OR
      OLD.meal_timing_preference IS DISTINCT FROM NEW.meal_timing_preference OR
      OLD.cooking_skill_level IS DISTINCT FROM NEW.cooking_skill_level) THEN
    NEW.preferences_last_updated = NOW();
  END IF;
  
  -- Set onboarding completed timestamp if completed flag changes to true
  IF OLD.onboarding_completed = FALSE AND NEW.onboarding_completed = TRUE THEN
    NEW.onboarding_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic timestamp updates (only if not exists)
DROP TRIGGER IF EXISTS update_profile_preferences_timestamp ON public.profiles;
CREATE TRIGGER update_profile_preferences_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_timestamp();

-- Function to get user preferences for RAG personalization
CREATE OR REPLACE FUNCTION get_user_preferences_for_rag(user_id_param UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
  user_prefs JSONB;
BEGIN
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
  
  RETURN COALESCE(user_prefs, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_preferences_for_rag(UUID) TO authenticated; 