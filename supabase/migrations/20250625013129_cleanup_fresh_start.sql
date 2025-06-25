-- Fresh Start Cleanup Migration
-- This migration cleans up all user-related data to ensure a clean slate for new sign-ups

-- Clean up all user-related data in dependency order
-- (child tables first, then parent tables)

-- Clear messaging and social data
DELETE FROM public.spotlight_reactions;
DELETE FROM public.spotlight_reports;
DELETE FROM public.spotlight_posts;
DELETE FROM public.stories;
DELETE FROM public.messages;
DELETE FROM public.conversation_participants;
DELETE FROM public.conversations;
DELETE FROM public.friends;
DELETE FROM public.blocked_users;

-- Clear user content and preferences
DELETE FROM public.journal_entries;
DELETE FROM public.user_preferences;
DELETE FROM public.user_stats;

-- Clear profiles (should already be empty due to CASCADE, but just to be sure)
DELETE FROM public.profiles;

-- Verify that all user-related tables are empty
-- This will help identify any missed cleanup
DO $$
DECLARE
    profile_count INTEGER;
    friends_count INTEGER;
    messages_count INTEGER;
    conversations_count INTEGER;
    journal_count INTEGER;
    spotlight_count INTEGER;
    stories_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO friends_count FROM public.friends;
    SELECT COUNT(*) INTO messages_count FROM public.messages;
    SELECT COUNT(*) INTO conversations_count FROM public.conversations;
    SELECT COUNT(*) INTO journal_count FROM public.journal_entries;
    SELECT COUNT(*) INTO spotlight_count FROM public.spotlight_posts;
    SELECT COUNT(*) INTO stories_count FROM public.stories;
    
    RAISE NOTICE 'Cleanup verification:';
    RAISE NOTICE 'Profiles: %, Friends: %, Messages: %, Conversations: %, Journal: %, Spotlight: %, Stories: %', 
        profile_count, friends_count, messages_count, conversations_count, journal_count, spotlight_count, stories_count;
        
    IF profile_count = 0 AND friends_count = 0 AND messages_count = 0 AND conversations_count = 0 
       AND journal_count = 0 AND spotlight_count = 0 AND stories_count = 0 THEN
        RAISE NOTICE 'Database successfully cleaned for fresh start!';
    ELSE
        RAISE NOTICE 'Some data remains - check cleanup logic';
    END IF;
END $$;
