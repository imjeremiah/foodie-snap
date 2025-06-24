-- Spotlight Seed Data Migration
-- This migration adds sample spotlight posts for testing and demonstration

-- Insert sample spotlight posts (only if users exist)
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    sample_journal_entry1 UUID;
    sample_journal_entry2 UUID;
BEGIN
    -- Get first two users from profiles table
    SELECT id INTO user1_id FROM public.profiles ORDER BY created_at LIMIT 1;
    SELECT id INTO user2_id FROM public.profiles ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Only proceed if we have users
    IF user1_id IS NOT NULL THEN
        -- Create some sample journal entries first
        INSERT INTO public.journal_entries (
            id,
            user_id,
            image_url,
            thumbnail_url,
            content_type,
            caption,
            shared_to_spotlight,
            tags,
            created_at
        ) VALUES
        (
            '11111111-1111-1111-1111-111111111111',
            user1_id,
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
            'photo',
            'Fresh homemade pancakes with maple syrup! Perfect start to the day 🥞',
            true,
            ARRAY['breakfast', 'homemade', 'pancakes'],
            NOW() - INTERVAL '2 hours'
        ),
        (
            '22222222-2222-2222-2222-222222222222',
            user1_id,
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
            'photo',
            'Healthy meal prep for the week! Grilled chicken, quinoa, and fresh vegetables 💪',
            true,
            ARRAY['mealprep', 'healthy', 'fitness'],
            NOW() - INTERVAL '4 hours'
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create spotlight posts from these journal entries
        INSERT INTO public.spotlight_posts (
            id,
            user_id,
            journal_entry_id,
            image_url,
            thumbnail_url,
            caption,
            content_type,
            like_count,
            view_count,
            tags,
            is_public,
            is_approved,
            is_flagged,
            audience_restriction,
            created_at
        ) VALUES
        (
            '33333333-3333-3333-3333-333333333333',
            user1_id,
            '11111111-1111-1111-1111-111111111111',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
            'Fresh homemade pancakes with maple syrup! Perfect start to the day 🥞',
            'photo',
            15,
            45,
            ARRAY['breakfast', 'homemade', 'pancakes'],
            true,
            true,
            false,
            'public',
            NOW() - INTERVAL '2 hours'
        ),
        (
            '44444444-4444-4444-4444-444444444444',
            user1_id,
            '22222222-2222-2222-2222-222222222222',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
            'Healthy meal prep for the week! Grilled chicken, quinoa, and fresh vegetables 💪',
            'photo',
            23,
            67,
            ARRAY['mealprep', 'healthy', 'fitness'],
            true,
            true,
            false,
            'public',
            NOW() - INTERVAL '4 hours'
        )
        ON CONFLICT (id) DO NOTHING;

        -- If we have a second user, create some posts for them too
        IF user2_id IS NOT NULL THEN
            INSERT INTO public.journal_entries (
                id,
                user_id,
                image_url,
                thumbnail_url,
                content_type,
                caption,
                shared_to_spotlight,
                tags,
                created_at
            ) VALUES
            (
                '55555555-5555-5555-5555-555555555555',
                user2_id,
                'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
                'photo',
                'Delicious sushi dinner! Fresh salmon and tuna rolls 🍣',
                true,
                ARRAY['sushi', 'dinner', 'seafood'],
                NOW() - INTERVAL '1 hour'
            ),
            (
                '66666666-6666-6666-6666-666666666666',
                user2_id,
                'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=400&fit=crop',
                'photo',
                'Morning smoothie bowl with fresh berries and granola! Starting the day right 🌟',
                true,
                ARRAY['smoothie', 'healthy', 'breakfast'],
                NOW() - INTERVAL '6 hours'
            )
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO public.spotlight_posts (
                id,
                user_id,
                journal_entry_id,
                image_url,
                thumbnail_url,
                caption,
                content_type,
                like_count,
                view_count,
                tags,
                is_public,
                is_approved,
                is_flagged,
                audience_restriction,
                created_at
            ) VALUES
            (
                '77777777-7777-7777-7777-777777777777',
                user2_id,
                '55555555-5555-5555-5555-555555555555',
                'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
                'Delicious sushi dinner! Fresh salmon and tuna rolls 🍣',
                'photo',
                31,
                89,
                ARRAY['sushi', 'dinner', 'seafood'],
                true,
                true,
                false,
                'public',
                NOW() - INTERVAL '1 hour'
            ),
            (
                '88888888-8888-8888-8888-888888888888',
                user2_id,
                '66666666-6666-6666-6666-666666666666',
                'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=800&fit=crop',
                'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=400&fit=crop',
                'Morning smoothie bowl with fresh berries and granola! Starting the day right 🌟',
                'photo',
                18,
                52,
                ARRAY['smoothie', 'healthy', 'breakfast'],
                true,
                true,
                false,
                'public',
                NOW() - INTERVAL '6 hours'
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;

        RAISE NOTICE 'Sample spotlight posts created successfully';
    ELSE
        RAISE NOTICE 'No users found, skipping spotlight seed data';
    END IF;
END $$; 