/**
 * @file Cron job configuration for weekly content spark generation
 * This file provides the setup for automated weekly content spark generation
 * 
 * To enable this cron job in Supabase:
 * 1. Set up pg_cron extension in your Supabase project
 * 2. Run the SQL commands below in your Supabase SQL editor
 * 3. The job will run every Monday at 9:00 AM UTC
 */

export const WEEKLY_CONTENT_SPARKS_CRON_SQL = `
-- Enable pg_cron extension (run this once as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly content spark generation
-- This will run every Monday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-content-sparks',                                    -- job name
  '0 9 * * 1',                                               -- cron expression (Monday 9 AM)
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-weekly-content-sparks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object('generateForAllUsers', true)
    );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job:
-- SELECT cron.unschedule('weekly-content-sparks');

-- To check job run history:
-- SELECT * FROM cron.job_run_details WHERE jobname = 'weekly-content-sparks' ORDER BY start_time DESC LIMIT 10;
`;

/**
 * Alternative: Manual trigger function for testing
 * This can be called directly from the Supabase dashboard for testing
 */
export const MANUAL_TRIGGER_SQL = `
-- Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_weekly_content_sparks()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
BEGIN
  -- Call the Edge Function to generate content sparks for all users
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-weekly-content-sparks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('generateForAllUsers', true)
  ) INTO response;
  
  RETURN 'Content spark generation triggered: ' || response;
END;
$$;

-- To manually trigger content spark generation:
-- SELECT trigger_weekly_content_sparks();
`;

/**
 * Setup instructions for production deployment
 */
export const SETUP_INSTRUCTIONS = `
SETUP INSTRUCTIONS FOR WEEKLY CONTENT SPARKS:

1. Enable pg_cron extension in your Supabase project:
   - Go to Database > Extensions in Supabase dashboard
   - Enable pg_cron extension

2. Replace placeholders in the SQL above:
   - Replace YOUR_PROJECT_ID with your actual Supabase project ID
   - Replace YOUR_SERVICE_ROLE_KEY with your actual service role key

3. Run the cron setup SQL in your Supabase SQL editor

4. Verify the job is scheduled:
   SELECT * FROM cron.job;

5. Test manually first:
   SELECT trigger_weekly_content_sparks();

6. Monitor job execution:
   SELECT * FROM cron.job_run_details WHERE jobname = 'weekly-content-sparks' ORDER BY start_time DESC LIMIT 10;

ALTERNATIVE SETUP WITH EXTERNAL CRON:
If you prefer to use external cron services (like GitHub Actions, Vercel Cron, etc.):

1. Set up a weekly cron job that makes a POST request to:
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-weekly-content-sparks

2. Include headers:
   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
   Content-Type: application/json

3. Include body:
   {"generateForAllUsers": true}

NOTIFICATION SETUP (Optional):
For actual push notifications, integrate with:
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS
- Expo Push Notifications for simplified cross-platform setup

The current implementation logs notifications but doesn't send them.
`;

export default {
  WEEKLY_CONTENT_SPARKS_CRON_SQL,
  MANUAL_TRIGGER_SQL,
  SETUP_INSTRUCTIONS
}; 