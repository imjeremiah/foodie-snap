-- Demo Content Sparks and AI Feedback Migration
-- Creates weekly content sparks and AI feedback data to showcase RAG learning features

-- Insert content sparks for demo users (current and past weeks)
INSERT INTO public.content_sparks (id, user_id, week_identifier, prompts, generation_context, viewed_at, prompts_used, created_at) VALUES

-- Alex Chen's current week content spark (protein-focused)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  (SELECT get_current_week_identifier()),
  '[
    {
      "title": "Post-Workout Protein Paradise",
      "description": "Show us your go-to high-protein recovery meal! Whether it''s a protein-packed smoothie bowl or a perfectly grilled piece of lean meat, capture how you fuel your muscle-building goals right after crushing your workout.",
      "type": "photo",
      "category": "nutrition",
      "difficulty": "easy",
      "estimated_time": "5 minutes"
    },
    {
      "title": "Sunday Prep Session Speed-Run",
      "description": "Create a quick time-lapse video of your meal prep process! Show the transformation from raw ingredients to perfectly portioned meals. Bonus points for highlighting your protein calculations and macro breakdowns.",
      "type": "video", 
      "category": "meal_prep",
      "difficulty": "medium",
      "estimated_time": "10 minutes"
    },
    {
      "title": "Muscle-Building Snack Innovation",
      "description": "Share your most creative high-protein snack creation! Maybe it''s homemade protein bars, Greek yogurt parfait, or that perfect post-gym smoothie combination. Tell us the protein content and why it works for your goals.",
      "type": "photo",
      "category": "recipe",
      "difficulty": "medium", 
      "estimated_time": "8 minutes"
    }
  ]'::jsonb,
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'fitness_goal', 'muscle_gain',
      'content_style', 'scientific',
      'dietary_restrictions', ARRAY['high_protein']
    ),
    'generated_at', NOW() - INTERVAL '2 days',
    'model_used', 'gpt-4o-mini',
    'personalization_factors', ARRAY['recent_protein_focus', 'meal_prep_history', 'scientific_tone_preference']
  ),
  NOW() - INTERVAL '1 day',
  ARRAY[0, 2], -- Used prompts 1 and 3
  NOW() - INTERVAL '2 days'
),

-- Sarah Johnson's current week content spark (plant-based athlete)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  (SELECT get_current_week_identifier()),
  '[
    {
      "title": "Plant Power Pre-Run Fuel",
      "description": "Show us your favorite plant-based breakfast that powers your morning runs! Whether it''s overnight oats with superfoods or a vibrant smoothie bowl, capture the natural energy that plants provide for endurance athletes.",
      "type": "photo",
      "category": "nutrition",
      "difficulty": "easy",
      "estimated_time": "5 minutes"
    },
    {
      "title": "Rainbow Bowl Assembly Art", 
      "description": "Create a satisfying video of building your most colorful plant-based bowl! Show each ingredient being added - from the base grains to the rainbow of vegetables. Prove that plant-based meals are never boring!",
      "type": "video",
      "category": "meal_prep", 
      "difficulty": "easy",
      "estimated_time": "7 minutes"
    },
    {
      "title": "Post-Workout Plant Protein Secret",
      "description": "Share your go-to plant-based recovery meal or snack! Whether it''s a protein-rich smoothie with hemp hearts or a quinoa power bowl, show how plants can meet all your athletic recovery needs.",
      "type": "photo",
      "category": "nutrition",
      "difficulty": "medium",
      "estimated_time": "6 minutes"
    }
  ]'::jsonb,
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'fitness_goal', 'athletic_performance',
      'content_style', 'inspirational',
      'dietary_restrictions', ARRAY['vegetarian', 'gluten_free']
    ),
    'generated_at', NOW() - INTERVAL '1 day',
    'model_used', 'gpt-4o-mini',
    'personalization_factors', ARRAY['plant_based_focus', 'running_context', 'inspirational_tone']
  ),
  NOW() - INTERVAL '6 hours',
  ARRAY[1], -- Used prompt 2
  NOW() - INTERVAL '1 day'
),

-- Mike Rodriguez's current week content spark (HIIT & IF)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  (SELECT get_current_week_identifier()),
  '[
    {
      "title": "Breaking the Fast Like a Boss",
      "description": "Show us your first meal after your fasting window! Whether it''s your perfectly timed post-HIIT fuel or that satisfying lunch that breaks your 16-hour fast, capture the moment when nutrition timing meets performance goals.",
      "type": "photo",
      "category": "nutrition",
      "difficulty": "easy", 
      "estimated_time": "5 minutes"
    },
    {
      "title": "HIIT Fuel vs Recovery Split-Screen",
      "description": "Create a side-by-side comparison of your pre-workout fuel and post-workout recovery! Show the strategic difference in your nutrition timing - maybe black coffee vs protein shake, or banana vs full meal.",
      "type": "photo",
      "category": "workout",
      "difficulty": "medium",
      "estimated_time": "8 minutes"
    },
    {
      "title": "Meal Prep for Warriors",
      "description": "Document your meal prep session designed around your training schedule and eating windows! Show how you batch prepare meals that fit perfectly into your intermittent fasting lifestyle and fuel your intense workouts.",
      "type": "video",
      "category": "meal_prep",
      "difficulty": "advanced",
      "estimated_time": "12 minutes"
    }
  ]'::jsonb,
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'fitness_goal', 'fat_loss',
      'content_style', 'quick_easy',
      'dietary_restrictions', ARRAY['keto', 'low_sodium']
    ),
    'generated_at', NOW() - INTERVAL '3 days',
    'model_used', 'gpt-4o-mini',
    'personalization_factors', ARRAY['intermittent_fasting', 'hiit_training', 'nutrient_timing_focus']
  ),
  NULL, -- Not viewed yet
  ARRAY[]::integer[], -- No prompts used yet
  NOW() - INTERVAL '3 days'
),

-- Emma Wilson's previous week content spark (for history)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  '2024-52', -- Previous week
  '[
    {
      "title": "Macro-Friendly Comfort Food Makeover",
      "description": "Transform a classic comfort food into a macro-friendly masterpiece! Whether it''s cauliflower crust pizza or protein pancakes, show how flexible dieting means never giving up your favorites.",
      "type": "photo",
      "category": "recipe",
      "difficulty": "medium",
      "estimated_time": "10 minutes"
    },
    {
      "title": "Perfect Portion Visual Guide",
      "description": "Create a visual guide showing what balanced macros actually look like on your plate! Use your hands, measuring tools, or whatever helps others understand proper portioning for flexible dieting success.",
      "type": "photo", 
      "category": "nutrition",
      "difficulty": "easy",
      "estimated_time": "5 minutes"
    },
    {
      "title": "Treat Meal Celebration",
      "description": "Show us how you enjoy a higher-calorie meal while staying on track! Whether it''s date night dinner or that planned pizza night, prove that flexible dieting includes room for life''s delicious moments.",
      "type": "photo",
      "category": "lifestyle",
      "difficulty": "easy",
      "estimated_time": "5 minutes"
    }
  ]'::jsonb,
  jsonb_build_object(
    'user_preferences', jsonb_build_object(
      'fitness_goal', 'maintenance',
      'content_style', 'detailed',
      'dietary_restrictions', ARRAY['dairy_free']
    ),
    'generated_at', NOW() - INTERVAL '10 days',
    'model_used', 'gpt-4o-mini'
  ),
  NOW() - INTERVAL '9 days',
  ARRAY[0, 2], -- Used prompts 1 and 3
  NOW() - INTERVAL '10 days'
);

-- Insert AI feedback data to show learning system
INSERT INTO public.ai_feedback (id, user_id, suggestion_type, suggestion_id, feedback_type, original_suggestion, edited_version, context_metadata, created_at) VALUES

-- Alex Chen's feedback (loves scientific/detailed suggestions)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'caption',
  'caption_alex_001',
  'thumbs_up',
  'Sunday meal prep complete! 💪 Grilled chicken thighs with sweet potato wedges and steamed broccoli. Each container packs 40g protein to fuel my muscle-building goals all week.',
  NULL,
  jsonb_build_object(
    'meal_type', 'meal_prep',
    'protein_mentioned', true,
    'user_goal_alignment', 'muscle_gain',
    'tone', 'scientific',
    'macro_details_included', true
  ),
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'caption',
  'caption_alex_002',
  'edited',
  'Post-workout smoothie time! 🥤',
  'Post-workout fuel ⚡ Chocolate protein smoothie with banana, oats, and almond butter. 35g protein to kickstart recovery! The gains don''t stop 🔥',
  jsonb_build_object(
    'meal_type', 'post_workout',
    'original_length', 'short',
    'edited_to_include', ARRAY['protein_amount', 'ingredients', 'goal_context'],
    'user_preference', 'detailed_with_numbers'
  ),
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'nutrition',
  'nutrition_alex_001',
  'thumbs_up',
  'This lean protein source provides all essential amino acids needed for muscle protein synthesis. The combination with complex carbohydrates optimizes post-workout recovery.',
  NULL,
  jsonb_build_object(
    'suggestion_context', 'steak_dinner',
    'scientific_language', true,
    'evidence_based', true
  ),
  NOW() - INTERVAL '3 days'
),

-- Sarah Johnson's feedback (loves inspirational tone)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'caption',
  'caption_sarah_001',
  'thumbs_up',
  'Rainbow power bowl! 🌈🌱 Quinoa base with roasted chickpeas, purple cabbage, carrots, and tahini dressing. Plant protein complete! Running 10K tomorrow with this fuel 💚',
  NULL,
  jsonb_build_object(
    'meal_type', 'power_bowl',
    'plant_based_focus', true,
    'athletic_context', true,
    'inspirational_tone', true,
    'emoji_usage', 'positive'
  ),
  NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'caption',
  'caption_sarah_002',
  'thumbs_down',
  'Green smoothie with spinach and mango.',
  NULL,
  jsonb_build_object(
    'meal_type', 'smoothie',
    'feedback_reason', 'too_plain',
    'missing_elements', ARRAY['inspiration', 'context', 'emotion'],
    'user_preference', 'motivational_uplifting'
  ),
  NOW() - INTERVAL '4 days'
),

-- Mike Rodriguez's feedback (likes practical/quick content)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'caption',
  'caption_mike_001',
  'thumbs_up',
  'Intermittent fasting broken right! 🔥 Avocado toast with hemp seeds and everything seasoning. First meal at 12pm after morning HIIT. Timing is everything! ⏰',
  NULL,
  jsonb_build_object(
    'meal_type', 'first_meal',
    'if_context', true,
    'timing_emphasis', true,
    'practical_tone', true
  ),
  NOW() - INTERVAL '4 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'nutrition',
  'nutrition_mike_001',
  'edited',
  'This meal provides sustained energy and supports fat burning goals.',
  'High protein, low carb = fat burning mode activated 🔥',
  jsonb_build_object(
    'suggestion_context', 'keto_dinner',
    'user_preference', 'short_punchy_statements',
    'goal_alignment', 'fat_loss'
  ),
  NOW() - INTERVAL '2 days'
),

-- Emma Wilson's feedback (appreciates balance/flexibility focus)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  'caption',
  'caption_emma_001',
  'thumbs_up',
  'Macro-friendly pizza night! 🍕 Cauliflower crust, part-skim mozzarella, and loaded with veggies. 28g protein, 35g carbs, 12g fat. Balance is everything! ⚖️',
  NULL,
  jsonb_build_object(
    'meal_type', 'treat_meal',
    'macro_breakdown_included', true,
    'flexible_dieting_context', true,
    'balance_emphasis', true
  ),
  NOW() - INTERVAL '12 hours'
),

-- James Taylor's feedback (loves culinary creativity)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com'),
  'caption',
  'caption_james_001',
  'thumbs_up',
  'Functional food meets flavor! 👨‍🍳 Grass-fed steak with herb chimichurri and roasted root vegetables. CrossFit fuel that doesn''t compromise on taste. Performance nutrition elevated! 🔥',
  NULL,
  jsonb_build_object(
    'meal_type', 'gourmet_dinner',
    'culinary_focus', true,
    'performance_context', true,
    'chef_perspective', true
  ),
  NOW() - INTERVAL '2 hours'
),

-- Maria Garcia's feedback (appreciates mindful/holistic approach)
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'maria.garcia@demo.foodiesnap.com'),
  'caption',
  'caption_maria_001',
  'thumbs_up',
  'Mindful morning ritual 🧘‍♀️✨ Golden milk chia pudding with turmeric, coconut, and fresh berries. Nourishing body and soul with intention. How we eat matters as much as what we eat 💛',
  NULL,
  jsonb_build_object(
    'meal_type', 'mindful_breakfast',
    'spiritual_context', true,
    'holistic_approach', true,
    'intention_focus', true
  ),
  NOW() - INTERVAL '6 hours'
);

-- Insert user statistics to show engagement
INSERT INTO public.user_stats (id, user_id, snaps_sent, snaps_received, photos_shared, messages_sent, friends_added, stories_posted, total_reactions_given, total_reactions_received, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 47
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 38  
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 42
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 31
    WHEN 'david.kim@demo.foodiesnap.com' THEN 29
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 35
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 33
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 26
    ELSE 20
  END as snaps_sent,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 52
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 44
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 39
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 37
    WHEN 'david.kim@demo.foodiesnap.com' THEN 34
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 41
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 38
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 31
    ELSE 25
  END as snaps_received,
  (SELECT COUNT(*) FROM public.journal_entries je WHERE je.user_id = p.id) as photos_shared,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 156
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 143
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 128
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 134
    WHEN 'david.kim@demo.foodiesnap.com' THEN 89
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 167
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 121
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 98
    ELSE 75
  END as messages_sent,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 8
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 6
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 7
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 5
    WHEN 'david.kim@demo.foodiesnap.com' THEN 4
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 9
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 6
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 5
    ELSE 3
  END as friends_added,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 12
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 18
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 15
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 9
    WHEN 'david.kim@demo.foodiesnap.com' THEN 7
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 14
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 11
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 16
    ELSE 5
  END as stories_posted,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 89
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 76
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 82
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 67
    WHEN 'david.kim@demo.foodiesnap.com' THEN 54
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 93
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 71
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 63
    ELSE 45
  END as total_reactions_given,
  CASE p.email
    WHEN 'alex.chen@demo.foodiesnap.com' THEN 124
    WHEN 'sarah.johnson@demo.foodiesnap.com' THEN 118
    WHEN 'mike.rodriguez@demo.foodiesnap.com' THEN 107
    WHEN 'emma.wilson@demo.foodiesnap.com' THEN 89
    WHEN 'david.kim@demo.foodiesnap.com' THEN 76
    WHEN 'lisa.rodriguez@demo.foodiesnap.com' THEN 132
    WHEN 'james.taylor@demo.foodiesnap.com' THEN 95
    WHEN 'maria.garcia@demo.foodiesnap.com' THEN 88
    ELSE 55
  END as total_reactions_received,
  p.created_at,
  NOW()
FROM public.profiles p
WHERE p.email LIKE '%demo.foodiesnap.com'
ON CONFLICT (user_id) DO UPDATE SET
  snaps_sent = EXCLUDED.snaps_sent,
  snaps_received = EXCLUDED.snaps_received,
  photos_shared = EXCLUDED.photos_shared,
  messages_sent = EXCLUDED.messages_sent,
  friends_added = EXCLUDED.friends_added,
  stories_posted = EXCLUDED.stories_posted,
  total_reactions_given = EXCLUDED.total_reactions_given,
  total_reactions_received = EXCLUDED.total_reactions_received,
  updated_at = NOW(); 