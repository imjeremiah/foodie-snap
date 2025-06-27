-- Create Demo Users Migration
-- Creates the base demo users needed for the comprehensive demo data

-- First, clean up existing demo data if any
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

-- Insert demo profiles (health-conscious users with fixed UUIDs)
INSERT INTO public.profiles (id, email, display_name, bio, created_at, updated_at) VALUES
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

-- Insert friend relationships between demo users
INSERT INTO public.friends (user_id, friend_id, status, created_at, updated_at) VALUES
-- Alex Chen's friends
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- Sarah Johnson's friends (reciprocal relationships)
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Mike Rodriguez's friends  
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

-- Emma Wilson's friends
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- Additional cross-connections for all users
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'); 