-- FoodieSnap Database Seed Script (Fixed Version)
-- This script populates the database with realistic demo data for testing and presentations
-- Works around the auth.users foreign key constraint for demo purposes

-- First, clean up existing seed data (for reset functionality)
-- Note: This will preserve real user data but remove demo data
DELETE FROM public.messages WHERE sender_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
);
DELETE FROM public.conversation_participants WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
);
DELETE FROM public.conversations WHERE created_by IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
);
DELETE FROM public.friends WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
) OR friend_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
);
DELETE FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com';

-- Temporarily disable the foreign key constraint for demo data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert demo profiles (health-conscious meal preppers)
INSERT INTO public.profiles (id, email, display_name, bio, created_at, updated_at) VALUES
-- Main demo users
('11111111-1111-1111-1111-111111111111', 'alex.chen@demo.foodiesnap.com', 'Alex Chen', 'Protein-focused fitness enthusiast 💪 Sharing my muscle-building meal prep journey!', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222', 'sarah.johnson@demo.foodiesnap.com', 'Sarah Johnson', 'Plant-based athlete 🌱 Proving you can be strong on plants! Marathon runner & recipe creator.', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 hours'),
('33333333-3333-3333-3333-333333333333', 'mike.rodriguez@demo.foodiesnap.com', 'Mike Rodriguez', 'HIIT trainer & nutrition coach 🔥 Helping others crush their fitness goals with smart meal timing!', NOW() - INTERVAL '20 days', NOW() - INTERVAL '4 hours'),
('44444444-4444-4444-4444-444444444444', 'emma.wilson@demo.foodiesnap.com', 'Emma Wilson', 'Macro tracking queen 👑 Flexible dieting for sustainable results. Love sharing balanced meal ideas!', NOW() - INTERVAL '18 days', NOW() - INTERVAL '6 hours'),
('55555555-5555-5555-5555-555555555555', 'david.kim@demo.foodiesnap.com', 'David Kim', 'Powerlifter & meal prep master 🏋️‍♂️ Sunday prep sessions for the win! High-protein, high-flavor recipes.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
('66666666-6666-6666-6666-666666666666', 'lisa.rodriguez@demo.foodiesnap.com', 'Lisa Rodriguez', 'Registered Dietitian & fitness enthusiast 🥗 Evidence-based nutrition for optimal performance!', NOW() - INTERVAL '12 days', NOW() - INTERVAL '30 minutes'),
('77777777-7777-7777-7777-777777777777', 'james.taylor@demo.foodiesnap.com', 'James Taylor', 'CrossFit athlete & chef 👨‍🍳 Creating functional foods that fuel performance and taste amazing!', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 hours'),
('88888888-8888-8888-8888-888888888888', 'maria.garcia@demo.foodiesnap.com', 'Maria Garcia', 'Yoga instructor & clean eater ✨ Mindful eating meets mindful movement. Holistic health advocate!', NOW() - INTERVAL '8 days', NOW() - INTERVAL '45 minutes');

-- Re-enable the foreign key constraint, but only for new real users
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
  NOT VALID;

-- Insert friend relationships
INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at) VALUES
-- Alex Chen's friends
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Sarah Johnson's friends (reciprocal relationships)
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- Mike Rodriguez's friends
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Emma Wilson's friends
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- David Kim's pending requests
('55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Additional cross-connections
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- Create conversations between friends
INSERT INTO public.conversations (id, created_by, created_at, updated_at) VALUES
-- Alex & Sarah conversation
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 minutes'),
-- Alex & Mike conversation  
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
-- Alex & Emma conversation
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
-- Sarah & Lisa conversation
('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
-- David & James conversation
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Add conversation participants
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at) VALUES
-- Alex & Sarah
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 hours'),
('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 hours'),
-- Alex & Mike
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 hours'),
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 hours'),
-- Alex & Emma
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
('c3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day'),
-- Sarah & Lisa
('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 hour'),
('c4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '1 hour'),
-- David & James
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days'),
('c5555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '2 days');

-- Insert realistic health-focused messages
INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at, read_by) VALUES
-- Alex & Sarah conversation (most recent)
('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Just finished my morning protein smoothie! 🥤 Added some spinach for extra nutrients', 'text', NOW() - INTERVAL '2 minutes', '{}'),
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Nice! What protein powder do you use? I''ve been experimenting with plant-based ones', 'text', NOW() - INTERVAL '5 minutes', '{}'),
('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'I love the Orgain vanilla! Blends so well with frozen berries', 'text', NOW() - INTERVAL '8 minutes', '{}'),
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Perfect timing - just hit my protein goal for the day 💪', 'text', NOW() - INTERVAL '12 minutes', '{}'),

-- Alex & Mike conversation  
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '🔥 That workout was intense! My legs are already feeling it', 'text', NOW() - INTERVAL '3 hours', '{}'),
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Haha I could barely walk after those Bulgarian split squats!', 'text', NOW() - INTERVAL '3 hours' + INTERVAL '5 minutes', '{}'),
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Wait until tomorrow 😈 Make sure you''re getting enough protein for recovery', 'text', NOW() - INTERVAL '2 hours' + INTERVAL '45 minutes', '{}'),

-- Alex & Emma conversation
('c3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Can you share your meal prep schedule? I''ve been struggling to stay consistent', 'text', NOW() - INTERVAL '1 day', '{}'),
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Of course! I prep on Sundays - 3 hours and I''m set for the week', 'text', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', '{}'),
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'I batch cook proteins, roast veggies, and portion out snacks. Game changer!', 'text', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes', '{}'),
('c3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'That sounds perfect! I''m definitely trying this Sunday', 'text', NOW() - INTERVAL '1 day' + INTERVAL '25 minutes', '{}'),

-- Sarah & Lisa conversation (nutritionist advice)
('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Quick question - thoughts on intermittent fasting for athletes?', 'text', NOW() - INTERVAL '1 hour', '{}'),
('c4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'It can work, but timing matters! What''s your training schedule like?', 'text', NOW() - INTERVAL '55 minutes', '{}'),
('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Early morning runs, usually around 6 AM', 'text', NOW() - INTERVAL '45 minutes', '{}'),

-- David & James conversation (powerlifting nutrition)
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Bro, that post-workout meal looked incredible! Recipe?', 'text', NOW() - INTERVAL '2 days', '{}'),
('c5555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'Thanks! Grilled chicken, sweet potato, and my secret sauce', 'text', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', '{}'),
('c5555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'Secret sauce = Greek yogurt, sriracha, and lime juice 🔥', 'text', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', '{}'),
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Genius! Definitely making this for tomorrow''s prep', 'text', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes', '{}');

-- Create a function to reset demo data (for presentations and testing)
CREATE OR REPLACE FUNCTION public.reset_demo_data()
RETURNS void AS $$
BEGIN
  -- Clean up existing demo data
  DELETE FROM public.messages WHERE sender_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  );
  DELETE FROM public.conversation_participants WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  );
  DELETE FROM public.conversations WHERE created_by IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  );
  DELETE FROM public.friends WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  ) OR friend_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com'
  );
  DELETE FROM public.profiles WHERE email LIKE '%demo.foodiesnap.com';
  
  -- Re-run the seed data insertion
  -- (This would contain the same INSERT statements as above)
  RAISE NOTICE 'Demo data has been reset. Please re-run the seed script to repopulate.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for the reset function
GRANT EXECUTE ON FUNCTION public.reset_demo_data() TO authenticated; 