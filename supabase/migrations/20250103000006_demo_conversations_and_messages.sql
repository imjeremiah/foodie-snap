-- Demo Conversations and Messages Migration
-- Creates realistic conversations and messages between demo users

-- First, let's create conversations using existing ones from seed data or create new ones
-- We'll work with the actual conversation structure (no participant_ids column)

-- Create conversation between Alex and Sarah if it doesn't exist
INSERT INTO public.conversations (id, created_by, created_at, updated_at)
SELECT 
  'c1111111-1111-1111-1111-111111111111'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com'),
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '30 minutes'
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations WHERE id = 'c1111111-1111-1111-1111-111111111111'::uuid
);

-- Add participants for Alex and Sarah conversation
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
SELECT 
  'c1111111-1111-1111-1111-111111111111'::uuid,
  id,
  NOW() - INTERVAL '2 days'
FROM public.profiles 
WHERE email IN ('alex.chen@demo.foodiesnap.com', 'sarah.johnson@demo.foodiesnap.com')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Insert messages for Alex and Sarah conversation
INSERT INTO public.messages (id, conversation_id, sender_id, content, message_type, created_at)
SELECT 
  gen_random_uuid(),
  'c1111111-1111-1111-1111-111111111111'::uuid,
  CASE 
    WHEN content LIKE '%Alex%' OR content LIKE '%protein%' THEN
      (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')
    ELSE 
      (SELECT id FROM public.profiles WHERE email = 'sarah.johnson@demo.foodiesnap.com')
  END,
  content,
  'text',
  created_at
FROM (
  VALUES 
    ('Hey Alex! Just saw your rainbow bowl post - that looked incredible! 🌈', NOW() - INTERVAL '2 days 14 hours'),
    ('Thanks Sarah! I''m trying to eat more colorful foods before my runs. How''s your protein bar experiment going?', NOW() - INTERVAL '2 days 13 hours'),
    ('Actually turned out great! Used dates, protein powder and almond butter. Want the recipe?', NOW() - INTERVAL '2 days 12 hours'),
    ('YES please! I''ve been looking for plant-friendly protein options', NOW() - INTERVAL '2 days 11 hours'),
    ('*shares recipe* The key is not over-mixing. Let me know how they turn out!', NOW() - INTERVAL '2 days 10 hours'),
    ('Making them this Sunday! BTW your meal prep game is insane 💪', NOW() - INTERVAL '2 days 8 hours'),
    ('Haha thanks! Consistency is everything. Speaking of which, saw your 10K time - crushing it!', NOW() - INTERVAL '1 day 16 hours'),
    ('Still working on sub-45 but getting there! Plant power is real 🌱', NOW() - INTERVAL '1 day 15 hours'),
    ('That''s awesome! Maybe we should do a virtual workout challenge sometime?', NOW() - INTERVAL '1 day 6 hours'),
    ('I''m in! Could be fun to mix strength and cardio', NOW() - INTERVAL '1 day 5 hours'),
    ('Perfect! I''ll think of something and get back to you', NOW() - INTERVAL '12 hours'),
    ('Looking forward to it! 🔥', NOW() - INTERVAL '30 minutes')
) AS sample_messages(content, created_at);

-- Create conversation between Mike and Alex (fitness bros)
INSERT INTO public.conversations (id, created_by, created_at, updated_at)
SELECT 
  'c2222222-2222-2222-2222-222222222222'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com'),
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations WHERE id = 'c2222222-2222-2222-2222-222222222222'::uuid
);

-- Add participants for Mike and Alex conversation
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
SELECT 
  'c2222222-2222-2222-2222-222222222222'::uuid,
  id,
  NOW() - INTERVAL '3 days'
FROM public.profiles 
WHERE email IN ('mike.rodriguez@demo.foodiesnap.com', 'alex.chen@demo.foodiesnap.com')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Messages between Mike and Alex
INSERT INTO public.messages (id, conversation_id, sender_id, content, message_type, created_at)
SELECT 
  gen_random_uuid(),
  'c2222222-2222-2222-2222-222222222222'::uuid,
  CASE 
    WHEN content LIKE 'Yo Alex%' OR content LIKE 'Dude%' THEN
      (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com')
    ELSE 
      (SELECT id FROM public.profiles WHERE email = 'alex.chen@demo.foodiesnap.com')
  END,
  content,
  'text',
  created_at
FROM (
  VALUES 
    ('Yo Alex! Saw your steak dinner post. That chimichurri looked fire 🔥', NOW() - INTERVAL '3 days 10 hours'),
    ('Thanks man! Been experimenting with herb sauces. How''s the IF going?', NOW() - INTERVAL '3 days 9 hours'),
    ('Solid! Down 3lbs this month. That 16:8 window is perfect for my schedule', NOW() - INTERVAL '3 days 8 hours'),
    ('Nice progress! I should try IF but I love my morning protein shake too much 😂', NOW() - INTERVAL '3 days 7 hours'),
    ('Dude you could just shift it to 12-8pm window. Still get your shake post-workout', NOW() - INTERVAL '3 days 6 hours'),
    ('True... might give it a shot. What''s your go-to first meal?', NOW() - INTERVAL '2 days 14 hours'),
    ('Usually that avocado toast with hemp seeds. Breaks the fast perfectly', NOW() - INTERVAL '2 days 13 hours'),
    ('Solid choice. Been meaning to ask - you still hitting HIIT 5x/week?', NOW() - INTERVAL '1 day 16 hours'),
    ('Yep! Just did a brutal leg day. Legs are GONE 💀', NOW() - INTERVAL '1 day 15 hours'),
    ('Haha I know that feeling. Recovery is key bro', NOW() - INTERVAL '1 day 12 hours'),
    ('For sure. Speaking of which, want to compare meal prep strategies this weekend?', NOW() - INTERVAL '8 hours'),
    ('I''m down! Always looking to optimize', NOW() - INTERVAL '3 hours')
) AS sample_messages(content, created_at);

-- Create conversation between Emma and Lisa (nutrition focused)
INSERT INTO public.conversations (id, created_by, created_at, updated_at)
SELECT 
  'c3333333-3333-3333-3333-333333333333'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com'),
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations WHERE id = 'c3333333-3333-3333-3333-333333333333'::uuid
);

-- Add participants for Emma and Lisa conversation
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
SELECT 
  'c3333333-3333-3333-3333-333333333333'::uuid,
  id,
  NOW() - INTERVAL '5 days'
FROM public.profiles 
WHERE email IN ('emma.wilson@demo.foodiesnap.com', 'lisa.rodriguez@demo.foodiesnap.com')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Messages between Emma and Lisa
INSERT INTO public.messages (id, conversation_id, sender_id, content, message_type, created_at)
SELECT 
  gen_random_uuid(),
  'c3333333-3333-3333-3333-333333333333'::uuid,
  CASE 
    WHEN content LIKE 'Lisa%' OR content LIKE 'Hey Lisa%' THEN
      (SELECT id FROM public.profiles WHERE email = 'emma.wilson@demo.foodiesnap.com')
    ELSE 
      (SELECT id FROM public.profiles WHERE email = 'lisa.rodriguez@demo.foodiesnap.com')
  END,
  content,
  'text',
  created_at
FROM (
  VALUES 
    ('Lisa! I saw your Mediterranean bowl post and had to ask - is that the omega-3 combo you mentioned?', NOW() - INTERVAL '5 days 8 hours'),
    ('Yes! Salmon, quinoa, and those colorful veggies. Perfect inflammation-fighting meal 📚', NOW() - INTERVAL '5 days 7 hours'),
    ('Love that you always back it up with science! Quick question about flexible dieting...', NOW() - INTERVAL '5 days 6 hours'),
    ('Ask away! Always happy to help with evidence-based approaches', NOW() - INTERVAL '5 days 5 hours'),
    ('Is it really sustainable long-term? I''ve been tracking macros for 3 months now', NOW() - INTERVAL '5 days 4 hours'),
    ('Great question! Research shows flexible approaches have better adherence than restrictive diets', NOW() - INTERVAL '4 days 14 hours'),
    ('That makes sense. I definitely don''t feel deprived like with past diets', NOW() - INTERVAL '4 days 13 hours'),
    ('Exactly! It''s about building a healthy relationship with food, not just short-term results', NOW() - INTERVAL '4 days 12 hours'),
    ('Speaking of relationships with food - any tips for meal planning without obsessing?', NOW() - INTERVAL '2 days 16 hours'),
    ('Focus on patterns over perfection. Aim for balanced meals but don''t stress single foods', NOW() - INTERVAL '2 days 15 hours'),
    ('That''s actually really helpful. I tend to overthink the details', NOW() - INTERVAL '2 days 8 hours'),
    ('It''s normal! Most people do. The key is zooming out to see the bigger picture', NOW() - INTERVAL '1 day 14 hours'),
    ('Thanks Lisa! You should consider doing nutrition coaching - you explain things so well', NOW() - INTERVAL '6 hours'),
    ('Actually thinking about it! Having these conversations makes me realize I love teaching this stuff', NOW() - INTERVAL '2 hours')
) AS sample_messages(content, created_at);

-- Create a group chat with James, David, and Mike
INSERT INTO public.conversations (id, created_by, created_at, updated_at)
SELECT 
  'c4444444-4444-4444-4444-444444444444'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com'),
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations WHERE id = 'c4444444-4444-4444-4444-444444444444'::uuid
);

-- Add participants for group chat
INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
SELECT 
  'c4444444-4444-4444-4444-444444444444'::uuid,
  id,
  NOW() - INTERVAL '1 week'
FROM public.profiles 
WHERE email IN ('james.taylor@demo.foodiesnap.com', 'david.kim@demo.foodiesnap.com', 'mike.rodriguez@demo.foodiesnap.com')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Group chat messages
INSERT INTO public.messages (id, conversation_id, sender_id, content, message_type, created_at)
SELECT 
  gen_random_uuid(),
  'c4444444-4444-4444-4444-444444444444'::uuid,
  CASE 
    WHEN content LIKE 'Guys%' OR content LIKE 'Alright%' THEN
      (SELECT id FROM public.profiles WHERE email = 'james.taylor@demo.foodiesnap.com')
    WHEN content LIKE 'Yooo%' OR content LIKE 'David%' THEN
      (SELECT id FROM public.profiles WHERE email = 'mike.rodriguez@demo.foodiesnap.com')
    ELSE 
      (SELECT id FROM public.profiles WHERE email = 'david.kim@demo.foodiesnap.com')
  END,
  content,
  'text',
  created_at
FROM (
  VALUES 
    ('Guys! New group for sharing our muscle fuel experiments 🔥', NOW() - INTERVAL '1 week'),
    ('Yooo I''m here for this! James your food always looks pro-level', NOW() - INTERVAL '6 days 20 hours'),
    ('Thanks bro! 20 years in kitchens pays off. David what''s your current bulk strategy?', NOW() - INTERVAL '6 days 18 hours'),
    ('Eating EVERYTHING 😂 But seriously, aiming for 3200 cals daily. Lot of Korean BBQ', NOW() - INTERVAL '6 days 16 hours'),
    ('Nice! Traditional foods are underrated for performance. Mike still doing IF?', NOW() - INTERVAL '6 days 14 hours'),
    ('Yep! 16:8 window working great. Though I''m jealous of David''s bulk calories ngl', NOW() - INTERVAL '6 days 12 hours'),
    ('Grass is always greener 😅 I miss being able to cut sometimes', NOW() - INTERVAL '5 days 16 hours'),
    ('Alright challenge time - who can make the best high-protein dessert this week?', NOW() - INTERVAL '4 days 10 hours'),
    ('OH IT''S ON! I''ve been working on a protein tiramisu 👨‍🍳', NOW() - INTERVAL '4 days 8 hours'),
    ('Protein tiramisu?! That''s next level. I was just gonna do protein ice cream', NOW() - INTERVAL '4 days 6 hours'),
    ('David what about you? Korean-inspired protein dessert maybe? 🤔', NOW() - INTERVAL '3 days 14 hours'),
    ('Actually... protein mochi might be possible. Give me a few days to experiment', NOW() - INTERVAL '3 days 12 hours'),
    ('This is why I love this group. We''re all mad scientists in the kitchen', NOW() - INTERVAL '2 days 16 hours'),
    ('Mad scientists with macros 📊🧪', NOW() - INTERVAL '2 days 14 hours'),
    ('Perfect description! Can''t wait to see everyone''s creations', NOW() - INTERVAL '1 day 18 hours'),
    ('Updates coming soon! My mochi experiment is looking promising 👀', NOW() - INTERVAL '1 hour')
) AS sample_messages(content, created_at);

-- Update conversation timestamps based on latest messages
UPDATE public.conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM public.messages m 
  WHERE m.conversation_id = conversations.id
)
WHERE id IN (
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'c3333333-3333-3333-3333-333333333333'::uuid,
  'c4444444-4444-4444-4444-444444444444'::uuid
);

-- Mark some messages as read for realistic UX
UPDATE public.messages 
SET read_by = jsonb_build_object(
  (SELECT cp.user_id::text 
   FROM public.conversation_participants cp 
   WHERE cp.conversation_id = messages.conversation_id 
   AND cp.user_id != messages.sender_id 
   LIMIT 1),
  (messages.created_at + INTERVAL '2 hours')::text
)
WHERE created_at < NOW() - INTERVAL '6 hours'
AND random() < 0.8; -- 80% of older messages are read

-- Summary: Creates realistic demo conversations and messages between demo users 
-- to showcase chat functionality with diverse conversation types and realistic messaging patterns. 