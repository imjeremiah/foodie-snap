-- Seed Spotlight Content Migration
-- This migration adds demo spotlight posts for a rich discovery experience

-- Create a function to seed spotlight content
CREATE OR REPLACE FUNCTION public.seed_spotlight_content()
RETURNS text AS $$
DECLARE
  demo_users UUID[];
  demo_user UUID;
  spotlight_post_1 UUID;
  spotlight_post_2 UUID;
  spotlight_post_3 UUID;
  spotlight_post_4 UUID;
  spotlight_post_5 UUID;
BEGIN
  -- Get existing demo users
  SELECT ARRAY(
    SELECT id FROM public.profiles 
    WHERE email LIKE '%demo.foodiesnap.com'
    ORDER BY created_at
    LIMIT 5
  ) INTO demo_users;
  
  -- If no demo users exist, return message
  IF array_length(demo_users, 1) IS NULL OR array_length(demo_users, 1) = 0 THEN
    RETURN 'No demo users found. Please run seed_demo_data() first to create demo users.';
  END IF;
  
  -- Check if spotlight content already exists
  IF EXISTS (
    SELECT 1 FROM public.spotlight_posts 
    WHERE user_id = ANY(demo_users)
    LIMIT 1
  ) THEN
    RETURN 'Demo spotlight content already exists.';
  END IF;
  
  -- Generate spotlight post IDs
  spotlight_post_1 := gen_random_uuid();
  spotlight_post_2 := gen_random_uuid();
  spotlight_post_3 := gen_random_uuid();
  spotlight_post_4 := gen_random_uuid();
  spotlight_post_5 := gen_random_uuid();
  
  -- Insert demo spotlight posts with placeholder images
  INSERT INTO public.spotlight_posts (
    id, user_id, image_url, thumbnail_url, caption, content_type, 
    like_count, view_count, tags, is_public, is_approved, 
    audience_restriction, created_at, updated_at
  ) VALUES
  -- Alex Chen's protein-focused posts
  (
    spotlight_post_1, 
    demo_users[1], 
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', 
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    'Sunday meal prep complete! 💪 Grilled chicken, sweet potatoes, and broccoli for the week. Simple, clean, effective. Who else is team #MealPrepSunday? #ProteinPower #FitnessFood',
    'photo',
    23, 156, 
    ARRAY['mealprep', 'protein', 'fitness', 'chicken', 'healthyeating'],
    true, true, 'public',
    NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
  ),
  -- Sarah Johnson's plant-based content
  (
    spotlight_post_2,
    demo_users[2], 
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    'Rainbow bowl perfection! 🌈🌱 Quinoa, roasted veggies, chickpeas, and tahini dressing. Plant-based fuel for my 10K run tomorrow! #PlantPowered #VeganAthlete #RainbowBowl',
    'photo',
    31, 245,
    ARRAY['plantbased', 'vegan', 'quinoa', 'running', 'colorful'],
    true, true, 'public',
    NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'
  ),
  -- Mike Rodriguez's HIIT nutrition
  (
    spotlight_post_3,
    demo_users[3],
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
    'Pre-workout fuel vs post-workout recovery! ⚡ Banana + coffee before, protein smoothie after. Timing is everything in fitness nutrition! #PreWorkout #PostWorkout #HIIT',
    'photo',
    18, 98,
    ARRAY['preworkout', 'postworkout', 'timing', 'hiit', 'nutrition'],
    true, true, 'public',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  ),
  -- Emma Wilson's macro tracking (if exists)
  (
    spotlight_post_4,
    COALESCE(demo_users[4], demo_users[1]),
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80',
    'Avocado toast elevation! 🥑✨ Sourdough, smashed avocado, hemp seeds, and everything bagel seasoning. Simple ingredients, maximum flavor! #AvocadoToast #HealthyFats #Breakfast',
    'photo',
    42, 198,
    ARRAY['avocado', 'breakfast', 'sourdough', 'healthyfats', 'simple'],
    true, true, 'public',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
  ),
  -- David Kim's powerlifting fuel (if exists)
  (
    spotlight_post_5,
    COALESCE(demo_users[5], demo_users[2]),
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&q=80',
    'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&q=80',
    'Homemade protein bars that actually taste good! 🍫 Dates, almonds, protein powder, and dark chocolate chips. Perfect post-gym snack! Recipe in my bio 📝 #ProteinBars #Homemade #PostGym',
    'photo',
    28, 134,
    ARRAY['proteinbars', 'homemade', 'snacks', 'dates', 'chocolate'],
    true, true, 'public',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  );
  
  -- Add some reactions to make posts feel active
  INSERT INTO public.spotlight_reactions (post_id, user_id, reaction_type, created_at) VALUES
  -- Multiple users liking different posts
  (spotlight_post_1, demo_users[2], 'like', NOW() - INTERVAL '5 hours'),
  (spotlight_post_1, demo_users[3], 'fire', NOW() - INTERVAL '4 hours'),
  (spotlight_post_2, demo_users[1], 'heart', NOW() - INTERVAL '11 hours'),
  (spotlight_post_2, demo_users[3], 'like', NOW() - INTERVAL '10 hours'),
  (spotlight_post_3, demo_users[1], 'like', NOW() - INTERVAL '20 hours'),
  (spotlight_post_3, demo_users[2], 'wow', NOW() - INTERVAL '18 hours'),
  (spotlight_post_4, demo_users[1], 'heart', NOW() - INTERVAL '1 day 12 hours'),
  (spotlight_post_4, demo_users[2], 'like', NOW() - INTERVAL '1 day 8 hours'),
  (spotlight_post_4, demo_users[3], 'fire', NOW() - INTERVAL '1 day 6 hours'),
  (spotlight_post_5, demo_users[1], 'like', NOW() - INTERVAL '2 days 12 hours'),
  (spotlight_post_5, demo_users[3], 'heart', NOW() - INTERVAL '2 days 8 hours');
  
  RETURN FORMAT('Successfully created %s demo spotlight posts! 🎉 Check the Spotlight feed to see them.', array_length(demo_users, 1));
  
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating spotlight content: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.seed_spotlight_content() TO authenticated;

-- Auto-run the spotlight seeding if demo users exist
DO $$
DECLARE
  result TEXT;
BEGIN
  SELECT public.seed_spotlight_content() INTO result;
  RAISE NOTICE '%', result;
END $$;
