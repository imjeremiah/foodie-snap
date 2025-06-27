-- Enhanced Demo User Preferences Migration
-- Adds detailed nutrition preferences to existing demo users for better RAG personalization

-- Update demo user profiles with comprehensive nutrition preferences
UPDATE public.profiles SET
  primary_fitness_goal = 'muscle_gain',
  secondary_fitness_goals = ARRAY['athletic_performance', 'clean_eating'],
  dietary_restrictions = ARRAY['high_protein'],
  allergies = ARRAY[]::text[],
  preferred_cuisines = ARRAY['asian', 'mediterranean'],
  preferred_content_style = 'scientific',
  content_tone_preferences = ARRAY['detailed', 'evidence_based'],
  meal_timing_preference = 'standard',
  cooking_skill_level = 'advanced',
  meal_prep_frequency = 'weekly',
  daily_calorie_goal = 2800,
  protein_goal_grams = 150,
  carb_preference = 'moderate_carb',
  activity_level = 'very_active',
  workout_frequency = '5-6_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '25 days',
  preferences_last_updated = NOW() - INTERVAL '2 days'
WHERE email = 'alex.chen@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'athletic_performance',
  secondary_fitness_goals = ARRAY['clean_eating', 'general_health'],
  dietary_restrictions = ARRAY['vegetarian', 'gluten_free'],
  allergies = ARRAY['nuts'],
  preferred_cuisines = ARRAY['mediterranean', 'indian'],
  preferred_content_style = 'inspirational',
  content_tone_preferences = ARRAY['uplifting', 'motivational'],
  meal_timing_preference = 'early_bird',
  cooking_skill_level = 'intermediate',
  meal_prep_frequency = 'bi_weekly',
  daily_calorie_goal = 2200,
  protein_goal_grams = 110,
  carb_preference = 'high_carb',
  activity_level = 'very_active',
  workout_frequency = 'daily',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '20 days',
  preferences_last_updated = NOW() - INTERVAL '1 day'
WHERE email = 'sarah.johnson@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'fat_loss',
  secondary_fitness_goals = ARRAY['muscle_gain', 'athletic_performance'],
  dietary_restrictions = ARRAY['keto', 'low_sodium'],
  allergies = ARRAY['shellfish'],
  preferred_cuisines = ARRAY['mexican', 'american'],
  preferred_content_style = 'quick_easy',
  content_tone_preferences = ARRAY['motivational', 'practical'],
  meal_timing_preference = 'intermittent_fasting',
  cooking_skill_level = 'intermediate',
  meal_prep_frequency = 'daily',
  daily_calorie_goal = 2400,
  protein_goal_grams = 140,
  carb_preference = 'low_carb',
  activity_level = 'extremely_active',
  workout_frequency = '5-6_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '15 days',
  preferences_last_updated = NOW() - INTERVAL '3 days'
WHERE email = 'mike.rodriguez@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'maintenance',
  secondary_fitness_goals = ARRAY['clean_eating'],
  dietary_restrictions = ARRAY['dairy_free'],
  allergies = ARRAY['dairy', 'eggs'],
  preferred_cuisines = ARRAY['italian', 'mediterranean'],
  preferred_content_style = 'detailed',
  content_tone_preferences = ARRAY['scientific', 'educational'],
  meal_timing_preference = 'flexible',
  cooking_skill_level = 'expert',
  meal_prep_frequency = 'weekly',
  daily_calorie_goal = 2000,
  protein_goal_grams = 100,
  carb_preference = 'moderate_carb',
  activity_level = 'moderately_active',
  workout_frequency = '3-4_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '13 days',
  preferences_last_updated = NOW() - INTERVAL '5 days'
WHERE email = 'emma.wilson@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'muscle_gain',
  secondary_fitness_goals = ARRAY['athletic_performance'],
  dietary_restrictions = ARRAY['high_protein'],
  allergies = ARRAY[]::text[],
  preferred_cuisines = ARRAY['korean', 'american'],
  preferred_content_style = 'humorous',
  content_tone_preferences = ARRAY['fun', 'relatable'],
  meal_timing_preference = 'standard',
  cooking_skill_level = 'beginner',
  meal_prep_frequency = 'weekly',
  daily_calorie_goal = 3200,
  protein_goal_grams = 180,
  carb_preference = 'high_carb',
  activity_level = 'extremely_active',
  workout_frequency = '5-6_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '10 days',
  preferences_last_updated = NOW() - INTERVAL '1 day'
WHERE email = 'david.kim@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'general_health',
  secondary_fitness_goals = ARRAY['clean_eating', 'maintenance'],
  dietary_restrictions = ARRAY['vegetarian', 'low_sodium'],
  allergies = ARRAY['soy'],
  preferred_cuisines = ARRAY['mediterranean', 'middle_eastern'],
  preferred_content_style = 'scientific',
  content_tone_preferences = ARRAY['evidence_based', 'professional'],
  meal_timing_preference = 'standard',
  cooking_skill_level = 'expert',
  meal_prep_frequency = 'bi_weekly',
  daily_calorie_goal = 1800,
  protein_goal_grams = 90,
  carb_preference = 'moderate_carb',
  activity_level = 'moderately_active',
  workout_frequency = '3-4_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '8 days',
  preferences_last_updated = NOW() - INTERVAL '2 days'
WHERE email = 'lisa.rodriguez@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'athletic_performance',
  secondary_fitness_goals = ARRAY['muscle_gain', 'clean_eating'],
  dietary_restrictions = ARRAY['paleo'],
  allergies = ARRAY['gluten'],
  preferred_cuisines = ARRAY['american', 'greek'],
  preferred_content_style = 'inspirational',
  content_tone_preferences = ARRAY['motivational', 'creative'],
  meal_timing_preference = 'standard',
  cooking_skill_level = 'expert',
  meal_prep_frequency = 'daily',
  daily_calorie_goal = 2600,
  protein_goal_grams = 130,
  carb_preference = 'moderate_carb',
  activity_level = 'extremely_active',
  workout_frequency = 'daily',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '6 days',
  preferences_last_updated = NOW() - INTERVAL '4 hours'
WHERE email = 'james.taylor@demo.foodiesnap.com';

UPDATE public.profiles SET
  primary_fitness_goal = 'general_health',
  secondary_fitness_goals = ARRAY['clean_eating'],
  dietary_restrictions = ARRAY['vegan', 'organic'],
  allergies = ARRAY[]::text[],
  preferred_cuisines = ARRAY['indian', 'thai'],
  preferred_content_style = 'casual',
  content_tone_preferences = ARRAY['mindful', 'holistic'],
  meal_timing_preference = 'flexible',
  cooking_skill_level = 'intermediate',
  meal_prep_frequency = 'rarely',
  daily_calorie_goal = 1900,
  protein_goal_grams = 85,
  carb_preference = 'high_carb',
  activity_level = 'lightly_active',
  workout_frequency = '3-4_per_week',
  onboarding_completed = true,
  onboarding_completed_at = NOW() - INTERVAL '4 days',
  preferences_last_updated = NOW() - INTERVAL '12 hours'
WHERE email = 'maria.garcia@demo.foodiesnap.com';

-- Create user preferences records for demo users
INSERT INTO public.user_preferences (user_id, push_notifications_enabled, message_notifications, friend_request_notifications, story_notifications, group_notifications, reaction_notifications, mention_notifications, allow_friend_requests, discoverable_by_email, discoverable_by_username, show_mutual_friends, show_friends_count, show_last_seen, profile_visibility, auto_save_to_journal, auto_download_media, read_receipts_enabled, typing_indicators_enabled, screenshot_notifications, dark_mode_enabled, reduce_motion, high_contrast, font_size, mature_content_filter, auto_play_videos, data_saver_mode, language_code, timezone, created_at, updated_at)
SELECT 
  id as user_id,
  true as push_notifications_enabled,
  true as message_notifications,
  true as friend_request_notifications,
  true as story_notifications,
  true as group_notifications,
  true as reaction_notifications,
  true as mention_notifications,
  true as allow_friend_requests,
  true as discoverable_by_email,
  true as discoverable_by_username,
  true as show_mutual_friends,
  true as show_friends_count,
  true as show_last_seen,
  'public' as profile_visibility,
  true as auto_save_to_journal,
  true as auto_download_media,
  true as read_receipts_enabled,
  true as typing_indicators_enabled,
  true as screenshot_notifications,
  false as dark_mode_enabled,
  false as reduce_motion,
  false as high_contrast,
  'medium' as font_size,
  false as mature_content_filter,
  true as auto_play_videos,
  false as data_saver_mode,
  'en' as language_code,
  'America/New_York' as timezone,
  created_at,
  updated_at
FROM public.profiles 
WHERE email LIKE '%demo.foodiesnap.com'
ON CONFLICT (user_id) DO NOTHING; 