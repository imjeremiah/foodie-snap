-- Demo Stories and Final Features Migration
-- Creates stories content and completes the demo experience

-- Insert active stories for demo users (within 24 hours)
INSERT INTO public.stories (id, user_id, image_url, thumbnail_url, caption, content_type, viewing_duration, expires_at, view_count, viewed_by, created_at, updated_at) VALUES

-- Alex Chen's recent stories
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  'Behind the scenes: Sunday meal prep grind! 💪 #MealPrepSunday',
  'photo',
  5,
  NOW() + INTERVAL '18 hours', -- Expires in 18 hours
  12,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com')::text, 
    jsonb_build_object('timestamp', (NOW() - INTERVAL '2 hours')::text, 'first_viewed_at', (NOW() - INTERVAL '2 hours')::text),
    (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '1 hour')::text, 'first_viewed_at', (NOW() - INTERVAL '1 hour')::text)
  ),
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&q=80',
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80',
  'Homemade protein bars turned out amazing! 🔥',
  'photo',
  5,
  NOW() + INTERVAL '15 hours',
  8,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'david.kim@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '3 hours')::text, 'first_viewed_at', (NOW() - INTERVAL '3 hours')::text)
  ),
  NOW() - INTERVAL '9 hours',
  NOW() - INTERVAL '9 hours'
),

-- Sarah Johnson's plant-based stories
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'Morning run fuel! Plant power activated 🌱⚡',
  'photo',
  5,
  NOW() + INTERVAL '20 hours',
  15,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '1 hour')::text, 'first_viewed_at', (NOW() - INTERVAL '1 hour')::text),
    (SELECT id FROM public.profiles WHERE email = 'lisa.rodriguez@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '30 minutes')::text, 'first_viewed_at', (NOW() - INTERVAL '30 minutes')::text)
  ),
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=800&q=80',
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=400&q=80',
  'Post-yoga green goddess vibes ✨ Feeling so centered',
  'photo',
  5,
  NOW() + INTERVAL '12 hours',
  21,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'maria.garcia@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '4 hours')::text, 'first_viewed_at', (NOW() - INTERVAL '4 hours')::text)
  ),
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '12 hours'
),

-- Mike Rodriguez's HIIT stories
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
  'Breaking my fast at exactly 12pm! Timing is everything ⏰',
  'photo',
  5,
  NOW() + INTERVAL '16 hours',
  9,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '2 hours')::text, 'first_viewed_at', (NOW() - INTERVAL '2 hours')::text)
  ),
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '8 hours'
),

-- Emma Wilson's flexible dieting story
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&q=80',
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80',
  'Pizza night that fits my macros! Balance is everything 🍕⚖️',
  'photo',
  5,
  NOW() + INTERVAL '22 hours',
  18,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '30 minutes')::text, 'first_viewed_at', (NOW() - INTERVAL '30 minutes')::text),
    (SELECT id FROM public.profiles WHERE email = 'david.kim@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '45 minutes')::text, 'first_viewed_at', (NOW() - INTERVAL '45 minutes')::text)
  ),
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),

-- James Taylor's chef story
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&q=80',
  'Tonight''s creation: Performance meets flavor! 👨‍🍳🔥',
  'photo',
  5,
  NOW() + INTERVAL '21 hours',
  14,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '1 hour')::text, 'first_viewed_at', (NOW() - INTERVAL '1 hour')::text)
  ),
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),

-- Maria Garcia's mindful story
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'maria.garcia@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
  'Mindful morning ritual complete 🧘‍♀️✨ Intention set for the day',
  'photo',
  5,
  NOW() + INTERVAL '19 hours',
  11,
  jsonb_build_object(
    (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com')::text,
    jsonb_build_object('timestamp', (NOW() - INTERVAL '2 hours')::text, 'first_viewed_at', (NOW() - INTERVAL '2 hours')::text)
  ),
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
);

-- Sample nutrition scan data (for demonstration without actual scanning)
CREATE TABLE IF NOT EXISTS demo_nutrition_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  nutrition_facts JSONB NOT NULL,
  health_insights TEXT[] NOT NULL,
  recipe_ideas TEXT[] NOT NULL,
  confidence FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO demo_nutrition_scans (food_name, image_url, nutrition_facts, health_insights, recipe_ideas, confidence) VALUES
(
  'Grilled Chicken Breast',
  'https://images.unsplash.com/photo-1532636259047-95eb3944bfad?w=800&q=80',
  jsonb_build_object(
    'calories', 231,
    'protein', 43.5,
    'carbs', 0,
    'fat', 5.0,
    'fiber', 0,
    'sodium', 89
  ),
  ARRAY[
    'Excellent source of complete protein with all essential amino acids',
    'Perfect for muscle building and recovery after workouts',
    'Low in saturated fat, supporting heart health',
    'Rich in B vitamins, especially niacin and B6 for energy metabolism'
  ],
  ARRAY[
    'Slice thin for protein-packed salads and grain bowls',
    'Shred for meal prep tacos or chicken salad',
    'Dice for quick stir-fries with vegetables',
    'Use in homemade chicken bone broth for gut health'
  ],
  0.92
),
(
  'Quinoa',
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  jsonb_build_object(
    'calories', 222,
    'protein', 8.1,
    'carbs', 39.4,
    'fat', 3.6,
    'fiber', 5.2,
    'sodium', 13
  ),
  ARRAY[
    'Complete protein grain containing all 9 essential amino acids',
    'High fiber content supports digestive health and satiety',
    'Good source of magnesium for muscle and nerve function',
    'Gluten-free alternative to wheat-based grains'
  ],
  ARRAY[
    'Use as base for colorful Buddha bowls with roasted vegetables',
    'Mix with herbs and lemon for a refreshing tabbouleh',
    'Add to breakfast porridge with fruits and nuts',
    'Use in homemade veggie burgers for plant-based protein'
  ],
  0.89
),
(
  'Avocado',
  'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80',
  jsonb_build_object(
    'calories', 320,
    'protein', 4.0,
    'carbs', 17.1,
    'fat', 29.5,
    'fiber', 13.5,
    'sodium', 14
  ),
  ARRAY[
    'Rich in heart-healthy monounsaturated fats',
    'High fiber content supports digestive health and blood sugar control',
    'Contains potassium for blood pressure regulation',
    'Provides folate essential for cellular function and DNA synthesis'
  ],
  ARRAY[
    'Mash with lime and seasonings for classic guacamole',
    'Slice for avocado toast with hemp seeds and microgreens',
    'Blend into smoothies for creamy texture and healthy fats',
    'Use in chocolate avocado mousse as a healthier dessert'
  ],
  0.94
),
(
  'Sweet Potato',
  'https://images.unsplash.com/photo-1576702213036-aaf2e4b3ebac?w=800&q=80',
  jsonb_build_object(
    'calories', 103,
    'protein', 2.3,
    'carbs', 23.6,
    'fat', 0.1,
    'fiber', 3.9,
    'sodium', 6
  ),
  ARRAY[
    'Excellent source of beta-carotene for immune function and eye health',
    'Complex carbohydrates provide sustained energy for workouts',
    'High in potassium supporting muscle function and recovery',
    'Natural sweetness can help satisfy cravings for processed sweets'
  ],
  ARRAY[
    'Roast with olive oil and herbs as a side dish',
    'Mash as a healthier alternative to regular mashed potatoes',
    'Slice thin and bake for homemade sweet potato chips',
    'Use in smoothies and baked goods for natural sweetness'
  ],
  0.91
);

-- Update profiles with more realistic snap scores based on activity
UPDATE public.profiles SET
  snap_score = CASE email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 2847
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 3156
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 2634
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 2289
    WHEN 'david.kim@demo.foodiesnap.com' THEN 1876
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 3542
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 2167
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 1945
    ELSE snap_score
  END,
  current_streak = CASE email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 12
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 18
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 7
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 5
    WHEN 'david.kim@demo.foodiesnap.com' THEN 3
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 21
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 9
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 14
    ELSE current_streak
  END,
  longest_streak = CASE email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 23
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 31
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 15
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 12
    WHEN 'david.kim@demo.foodiesnap.com' THEN 8
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 45
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 18
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 27
    ELSE longest_streak
  END,
  last_snap_date = CASE email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN NOW() - INTERVAL '2 hours'
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN NOW() - INTERVAL '45 minutes'
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN NOW() - INTERVAL '3 hours'
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN NOW() - INTERVAL '4 hours'
    WHEN 'david.kim@demo.foodiesnap.com' THEN NOW() - INTERVAL '6 hours'
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN NOW() - INTERVAL '1 hour'
    WHEN 'james.taylor@demo.foodiesnap.com' THEN NOW() - INTERVAL '5 hours'
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN NOW() - INTERVAL '2 hours'
    ELSE last_snap_date
  END
WHERE email LIKE '%demo.foodiesnap.com';

-- Create a comprehensive demo data status function
CREATE OR REPLACE FUNCTION check_demo_data_status()
RETURNS TABLE (
  feature TEXT,
  count INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Demo Users'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Journal Entries'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.journal_entries je JOIN public.profiles p ON je.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Content Embeddings'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.content_embeddings ce JOIN public.profiles p ON ce.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Content Sparks'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.content_sparks cs JOIN public.profiles p ON cs.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'AI Feedback'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.ai_feedback af JOIN public.profiles p ON af.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Spotlight Posts'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.spotlight_posts sp JOIN public.profiles p ON sp.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Stories'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM public.stories s JOIN public.profiles p ON s.user_id = p.id WHERE p.email LIKE '%demo.foodiesnap.com'),
         'Complete'::TEXT
  UNION ALL
  SELECT 'Demo Nutrition Scans'::TEXT,
         (SELECT COUNT(*)::INTEGER FROM demo_nutrition_scans),
         'Complete'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_demo_data_status() TO authenticated; 