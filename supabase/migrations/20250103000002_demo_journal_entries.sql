-- Demo Journal Entries Migration
-- Creates realistic journal entries for demo users to showcase journal and RAG features

-- Insert journal entries for Alex Chen (Protein-focused fitness enthusiast)
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
-- Alex's recent entries
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  'photo',
  'Sunday meal prep complete! 💪 Grilled chicken thighs, sweet potato wedges, and steamed broccoli. 40g protein per serving - hitting my macro targets all week! #MealPrepSunday #ProteinGoals',
  false, true, true,
  ARRAY['mealprep', 'protein', 'chicken', 'sunday', 'batch cooking'],
  'grilled chicken sweet potato broccoli meal prep containers',
  true, false, 'Weekly Prep',
  2845760, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  'photo',
  'Post-workout fuel ⚡ Chocolate protein smoothie with banana, oats, and almond butter. 35g protein to kickstart recovery! The gains don''t stop 🔥',
  true, false, false,
  ARRAY['postworkout', 'protein smoothie', 'recovery', 'chocolate'],
  'chocolate protein smoothie banana almond butter',
  false, false, 'Post Workout',
  1876432, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&q=80',
  'photo',
  'Dinner perfection! 🥩 8oz sirloin steak with roasted asparagus and quinoa. Simple, clean, effective. This is how you fuel muscle growth!',
  false, false, true,
  ARRAY['dinner', 'steak', 'protein', 'asparagus', 'quinoa'],
  'sirloin steak asparagus quinoa dinner plate',
  true, false, 'Dinners',
  2156789, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&q=80',
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80',
  'photo',
  'Homemade protein bars coming in clutch! 💯 Dates, whey protein, almonds, and dark chocolate chips. 25g protein per bar - perfect pre-gym snack!',
  true, true, false,
  ARRAY['protein bars', 'homemade', 'snacks', 'pre-gym'],
  'homemade protein bars dates almonds chocolate',
  false, false, 'Snacks',
  1654321, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
);

-- Sarah's plant-based entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'photo',
  'Rainbow power bowl! 🌈🌱 Quinoa base with roasted chickpeas, purple cabbage, carrots, and tahini dressing. Plant protein complete! Running 10K tomorrow with this fuel 💚',
  false, true, true,
  ARRAY['plantbased', 'rainbow bowl', 'quinoa', 'chickpeas', 'running'],
  'rainbow bowl quinoa chickpeas vegetables tahini',
  true, false, 'Power Bowls',
  2334567, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
  'photo',
  'Pre-run breakfast perfection! 🏃‍♀️ Overnight oats with chia seeds, almond milk, berries, and maple syrup. Slow-release carbs for sustained energy ⚡',
  true, false, false,
  ARRAY['breakfast', 'overnight oats', 'pre-run', 'chia seeds', 'berries'],
  'overnight oats chia seeds berries almond milk',
  false, false, 'Breakfast',
  1543210, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 8 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&q=80',
  'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&q=80',
  'photo',
  'Sunday meal prep: plant edition! 🌿 Lentil curry, roasted vegetables, and brown rice. Prepping 5 days of nutrient-dense meals. Plants = performance! 💪',
  false, true, false,
  ARRAY['mealprep', 'plantbased', 'lentil curry', 'vegetables', 'brown rice'],
  'lentil curry roasted vegetables brown rice meal prep',
  true, false, 'Weekly Prep',
  2876543, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=800&q=80',
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=400&q=80',
  'photo',
  'Green goddess smoothie post-yoga 🧘‍♀️💚 Spinach, mango, coconut water, and hemp seeds. Feeling centered and nourished from the inside out ✨',
  false, false, false,
  ARRAY['smoothie', 'green', 'post-yoga', 'spinach', 'mango'],
  'green smoothie spinach mango coconut water hemp seeds',
  false, false, 'Smoothies',
  1765432, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
);

-- Mike's HIIT nutrition entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
  'photo',
  'Intermittent fasting broken right! 🔥 Avocado toast with hemp seeds and everything seasoning. First meal at 12pm after morning HIIT. Timing is everything! ⏰',
  true, true, false,
  ARRAY['intermittent fasting', 'avocado toast', 'post-hiit', 'timing'],
  'avocado toast hemp seeds everything seasoning',
  false, false, 'IF Meals',
  1987654, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1563379091339-03246963d25a?w=800&q=80',
  'https://images.unsplash.com/photo-1563379091339-03246963d25a?w=400&q=80',
  'photo',
  'Pre-workout fuel vs post-workout recovery! ⚡ Black coffee + banana before, protein shake + berries after. Nutrient timing for maximum results 💯',
  false, false, true,
  ARRAY['nutrient timing', 'pre-workout', 'post-workout', 'coffee', 'protein'],
  'black coffee banana protein shake berries',
  true, false, 'Workout Nutrition',
  2123456, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  'photo',
  'Dinner in my eating window! 🍽️ Grilled salmon, cauliflower rice, and roasted Brussels sprouts. High protein, low carb = fat burning mode activated 🔥',
  false, true, false,
  ARRAY['dinner', 'keto', 'salmon', 'cauliflower rice', 'fat burning'],
  'grilled salmon cauliflower rice brussels sprouts',
  false, false, 'Keto Dinners',
  2456789, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80',
  'photo',
  'Meal prep game strong! 💪 Turkey meatballs with zucchini noodles and marinara. 5 meals ready for the week. Consistency builds champions! 🏆',
  true, false, false,
  ARRAY['meal prep', 'turkey meatballs', 'zucchini noodles', 'consistency'],
  'turkey meatballs zucchini noodles marinara sauce',
  true, false, 'Weekly Prep',
  2654321, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
);

-- Emma's macro tracking entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&q=80',
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80',
  'photo',
  'Macro-friendly pizza night! 🍕 Cauliflower crust, part-skim mozzarella, and loaded with veggies. 28g protein, 35g carbs, 12g fat. Balance is everything! ⚖️',
  false, true, true,
  ARRAY['macros', 'pizza', 'cauliflower crust', 'balanced', 'tracking'],
  'cauliflower crust pizza mozzarella vegetables',
  true, false, 'Balanced Meals',
  2234567, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'photo',
  'Perfectly portioned lunch! 📏 4oz chicken breast, 150g sweet potato, mixed greens with olive oil. Hitting my macros without the stress. Flexible dieting works! 🎯',
  true, false, false,
  ARRAY['portion control', 'macros', 'chicken', 'sweet potato', 'flexible dieting'],
  'chicken breast sweet potato mixed greens olive oil',
  false, false, 'Balanced Meals',
  1876543, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 6 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  'photo',
  'Treat meal that fits my macros! 🎉 Dark chocolate protein smoothie bowl with strawberries and granola. 32g protein, satisfies my sweet tooth. This is why I love flexible dieting! 💕',
  false, false, false,
  ARRAY['treat meal', 'protein smoothie bowl', 'chocolate', 'flexible dieting'],
  'chocolate protein smoothie bowl strawberries granola',
  true, false, 'Treats',
  2098765, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
);

-- David's powerlifting entries  
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'david.kim@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&q=80',
  'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&q=80',
  'photo',
  'Bulking season fuel! 🔥 Korean BBQ beef with kimchi and rice. Getting those calories in for my powerlifting meet prep. 50g protein, 80g carbs - gains incoming! 📈',
  true, true, false,
  ARRAY['bulking', 'korean bbq', 'powerlifting', 'kimchi', 'rice'],
  'korean bbq beef kimchi rice',
  false, false, 'Bulking Meals',
  2765432, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'david.kim@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&q=80',
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80',
  'photo',
  'Sunday prep day! 💪 Made 20 protein bars with dates, protein powder, and peanut butter. Hitting 3200 cals daily requires planning. Strength comes from the kitchen! 🏠',
  false, false, true,
  ARRAY['meal prep', 'protein bars', 'bulk calories', 'strength'],
  'homemade protein bars dates peanut butter',
  true, false, 'Weekly Prep',
  2543210, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
);

-- Lisa's nutritionist entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'lisa.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'photo',
  'Evidence-based nutrition in action! 📚 Mediterranean bowl with salmon, quinoa, and colorful vegetables. Rich in omega-3s, fiber, and antioxidants. Science-backed wellness! 🧬',
  false, true, true,
  ARRAY['evidence-based', 'mediterranean', 'salmon', 'nutrition science'],
  'mediterranean bowl salmon quinoa vegetables',
  true, false, 'Educational',
  2456789, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'lisa.rodriguez@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=800&q=80',
  'https://images.unsplash.com/photo-1547496502-affa22d78919?w=400&q=80',
  'photo',
  'Client education moment! 🎓 Green smoothie with optimal nutrient ratios: 2:1 carb to protein, plus healthy fats from avocado. Teaching sustainable nutrition habits! 💚',
  true, false, false,
  ARRAY['client education', 'green smoothie', 'nutrient ratios', 'sustainable'],
  'green smoothie avocado spinach protein',
  false, false, 'Educational',
  1654321, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 4 hours'
);

-- James's chef entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&q=80',
  'photo',
  'Functional food meets flavor! 👨‍🍳 Grass-fed steak with herb chimichurri and roasted root vegetables. CrossFit fuel that doesn''t compromise on taste. Performance nutrition elevated! 🔥',
  false, true, true,
  ARRAY['functional food', 'grass-fed steak', 'crossfit', 'chimichurri'],
  'grass-fed steak chimichurri root vegetables',
  true, false, 'Performance Meals',
  2876543, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&q=80',
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80',
  'photo',
  'Paleo pizza innovation! 🍕 Sweet potato crust, grass-fed ground beef, and dairy-free cheese. Proving that functional nutrition can be indulgent. Recipe dropping soon! 📝',
  true, false, false,
  ARRAY['paleo', 'sweet potato crust', 'innovation', 'dairy-free'],
  'paleo pizza sweet potato crust ground beef',
  false, false, 'Recipes',
  2345678, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 2 hours'
);

-- Maria's mindful eating entries
INSERT INTO public.journal_entries (
  id, user_id, image_url, thumbnail_url, content_type, caption, 
  shared_to_chat, shared_to_story, shared_to_spotlight, 
  tags, extracted_text, is_favorite, is_archived, folder_name,
  file_size, dimensions, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'maria.garcia@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
  'photo',
  'Mindful morning ritual 🧘‍♀️✨ Golden milk chia pudding with turmeric, coconut, and fresh berries. Nourishing body and soul with intention. How we eat matters as much as what we eat 💛',
  false, true, false,
  ARRAY['mindful eating', 'golden milk', 'chia pudding', 'turmeric'],
  'golden milk chia pudding turmeric coconut berries',
  true, false, 'Mindful Meals',
  1765432, '{"width": 1080, "height": 1080}',
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE email = 'maria.garcia@demo.foodiesnap.com'),
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'photo',
  'Sacred Sunday meal prep 🙏 Preparing nourishing bowls with love and gratitude. Each ingredient chosen mindfully for optimal energy and wellness. Food is medicine ✨',
  false, false, false,
  ARRAY['sacred', 'meal prep', 'gratitude', 'food as medicine'],
  'nourishing bowls vegetables quinoa mindful preparation',
  false, false, 'Weekly Prep',
  2123456, '{"width": 1080, "height": 1350}',
  NOW() - INTERVAL '1 day 10 hours', NOW() - INTERVAL '1 day 10 hours'
); 