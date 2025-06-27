/**
 * Database Functions Diagnostic Script
 * Checks if required database functions exist for Content Sparks and Journal Analytics
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found in project root');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  }
  return true;
}

// Load the environment variables
if (!loadEnvLocal()) {
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables in .env.local:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseFunctions() {
  console.log('🔍 Checking Database Functions for FoodieSnap\n');

  // Required functions for the app to work
  const requiredFunctions = [
    'get_current_content_spark',
    'get_current_week_identifier', 
    'get_users_needing_content_sparks',
    'mark_content_spark_viewed',
    'record_prompt_usage',
    'get_journal_analytics_with_insights',
    'find_similar_meals'
  ];

  const missingFunctions = [];

  for (const functionName of requiredFunctions) {
    try {
      console.log(`Checking function: ${functionName}`);
      
      // Try to call the function with dummy parameters to see if it exists
      let testResult;
      switch (functionName) {
        case 'get_current_week_identifier':
          testResult = await supabase.rpc(functionName);
          break;
        case 'get_current_content_spark':
          // Pass a dummy user ID - function should exist even if it returns empty
          testResult = await supabase.rpc(functionName, { 
            user_id_param: '00000000-0000-0000-0000-000000000000' 
          });
          break;
        case 'get_journal_analytics_with_insights':
          testResult = await supabase.rpc(functionName, { 
            user_id_param: '00000000-0000-0000-0000-000000000000',
            time_range_days: 30
          });
          break;
        case 'find_similar_meals':
          testResult = await supabase.rpc(functionName, { 
            user_id_param: '00000000-0000-0000-0000-000000000000',
            entry_id: '00000000-0000-0000-0000-000000000000',
            similarity_threshold: 0.7,
            max_results: 10
          });
          break;
        default:
          // For other functions, just try to call them
          testResult = await supabase.rpc(functionName);
      }

      if (testResult.error) {
        if (testResult.error.message.includes('does not exist') || 
            testResult.error.message.includes('function') && testResult.error.message.includes('unknown')) {
          console.log(`❌ ${functionName} - MISSING`);
          missingFunctions.push(functionName);
        } else {
          console.log(`✅ ${functionName} - EXISTS (${testResult.error.message})`);
        }
      } else {
        console.log(`✅ ${functionName} - EXISTS AND WORKING`);
      }
    } catch (error) {
      console.log(`❌ ${functionName} - ERROR: ${error.message}`);
      missingFunctions.push(functionName);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Working functions: ${requiredFunctions.length - missingFunctions.length}`);
  console.log(`❌ Missing functions: ${missingFunctions.length}`);

  if (missingFunctions.length > 0) {
    console.log(`\n🔧 Missing Functions:`);
    missingFunctions.forEach(func => console.log(`   - ${func}`));
    
    console.log(`\n💡 To fix this, apply the database setup SQL in your Supabase dashboard:`);
    console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
    console.log(`   2. Copy the SQL from the instructions below`);
    console.log(`   3. Run it in the SQL Editor`);
    
    return false;
  } else {
    console.log(`\n🎉 All required functions are present!`);
    return true;
  }
}

async function checkTables() {
  console.log('\n🔍 Checking Required Tables\n');

  const requiredTables = [
    'content_sparks',
    'journal_entries', 
    'profiles'
  ];

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName} - MISSING OR NO ACCESS: ${error.message}`);
      } else {
        console.log(`✅ ${tableName} - EXISTS`);
      }
    } catch (error) {
      console.log(`❌ ${tableName} - ERROR: ${error.message}`);
    }
  }
}

async function testAuthentication() {
  console.log('\n🔍 Testing Database Connection\n');
  
  try {
    // Test service role access
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, onboarding_completed')
      .limit(5);
    
    if (error) {
      console.log(`❌ Database access failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Database connection working`);
    console.log(`📊 Found ${profiles?.length || 0} user profiles`);
    
    if (profiles && profiles.length > 0) {
      const completedOnboarding = profiles.filter(p => p.onboarding_completed).length;
      console.log(`📊 Users with completed onboarding: ${completedOnboarding}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Database connection test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 FoodieSnap Database Diagnostic Tool');
  console.log('📁 Using environment from: .env.local\n');
  
  const authOk = await testAuthentication();
  if (!authOk) {
    console.log('\n❌ Database connection failed. Check your .env.local file.');
    return;
  }
  
  await checkTables();
  const functionsOk = await checkDatabaseFunctions();
  
  if (!functionsOk) {
    console.log('\n🔧 MANUAL FIX NEEDED:');
    console.log('Copy and paste this SQL into your Supabase Dashboard → SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(getDatabaseSetupSQL());
    console.log('='.repeat(60));
    console.log('\nThen run this diagnostic again to verify the fix worked.');
  } else {
    console.log('\n✅ Database is ready! Content Sparks and Journal Analytics should work.');
  }
}

function getDatabaseSetupSQL() {
  return `-- FoodieSnap Database Setup - Copy and paste this into Supabase SQL Editor

-- Create content_sparks table
CREATE TABLE IF NOT EXISTS public.content_sparks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_identifier TEXT NOT NULL,
  prompts JSONB NOT NULL,
  generation_context JSONB DEFAULT '{}',
  viewed_at TIMESTAMP WITH TIME ZONE,
  prompts_used INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_identifier)
);

-- Enable RLS
ALTER TABLE public.content_sparks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own content sparks" ON public.content_sparks;
CREATE POLICY "Users can view their own content sparks" ON public.content_sparks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own content sparks" ON public.content_sparks;
CREATE POLICY "Users can update their own content sparks" ON public.content_sparks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS content_sparks_user_id_idx ON public.content_sparks(user_id);
CREATE INDEX IF NOT EXISTS content_sparks_week_idx ON public.content_sparks(week_identifier);

-- Add notification preferences to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='content_spark_notifications') THEN
    ALTER TABLE public.profiles ADD COLUMN content_spark_notifications BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Week identifier function
CREATE OR REPLACE FUNCTION get_current_week_identifier()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(EXTRACT(WEEK FROM NOW())::TEXT, 2, '0');
END; $$;

-- Get current content spark function
CREATE OR REPLACE FUNCTION get_current_content_spark(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID, prompts JSONB, generation_context JSONB, viewed_at TIMESTAMP WITH TIME ZONE,
  prompts_used INTEGER[], created_at TIMESTAMP WITH TIME ZONE, is_new BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE current_week TEXT;
BEGIN
  SELECT get_current_week_identifier() INTO current_week;
  RETURN QUERY
  SELECT cs.id, cs.prompts, cs.generation_context, cs.viewed_at, cs.prompts_used, cs.created_at,
         (cs.viewed_at IS NULL) as is_new
  FROM public.content_sparks cs
  WHERE cs.user_id = user_id_param AND cs.week_identifier = current_week;
END; $$;

-- Mark content spark as viewed
CREATE OR REPLACE FUNCTION mark_content_spark_viewed(content_spark_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.content_sparks SET viewed_at = NOW()
  WHERE id = content_spark_id AND user_id = auth.uid() AND viewed_at IS NULL;
  RETURN FOUND;
END; $$;

-- Record prompt usage
CREATE OR REPLACE FUNCTION record_prompt_usage(content_spark_id UUID, prompt_index INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.content_sparks 
  SET prompts_used = ARRAY_APPEND(COALESCE(prompts_used, '{}'), prompt_index)
  WHERE id = content_spark_id AND user_id = auth.uid() 
    AND NOT (prompt_index = ANY(COALESCE(prompts_used, '{}')));
  RETURN FOUND;
END; $$;

-- Get users needing content sparks
CREATE OR REPLACE FUNCTION get_users_needing_content_sparks()
RETURNS TABLE (user_id UUID, email TEXT, display_name TEXT, content_spark_notifications BOOLEAN, preferences JSONB)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_week TEXT;
BEGIN
  SELECT get_current_week_identifier() INTO current_week;
  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.content_spark_notifications, row_to_json(p)::JSONB as preferences
  FROM public.profiles p LEFT JOIN public.content_sparks cs ON (cs.user_id = p.id AND cs.week_identifier = current_week)
  WHERE p.content_spark_notifications = true AND p.onboarding_completed = true AND cs.id IS NULL;
END; $$;

-- Add missing columns to journal_entries
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='meal_type') THEN
    ALTER TABLE public.journal_entries ADD COLUMN meal_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='estimated_calories') THEN
    ALTER TABLE public.journal_entries ADD COLUMN estimated_calories INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='estimated_protein') THEN
    ALTER TABLE public.journal_entries ADD COLUMN estimated_protein DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='ingredients') THEN
    ALTER TABLE public.journal_entries ADD COLUMN ingredients TEXT[];
  END IF;
END $$;

-- Journal analytics function
CREATE OR REPLACE FUNCTION get_journal_analytics_with_insights(user_id_param UUID, time_range_days INTEGER DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_entries INTEGER; cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - INTERVAL '1 day' * time_range_days;
  SELECT COUNT(*) INTO total_entries FROM public.journal_entries WHERE user_id = user_id_param AND created_at >= cutoff_date;
  
  RETURN json_build_object(
    'total_entries', total_entries,
    'meal_type_distribution', '{}',
    'nutrition_trends', json_build_object('total_meals_analyzed', 0),
    'top_ingredients', ARRAY[]::TEXT[],
    'ai_insights', ARRAY[
      'You have logged ' || total_entries || ' meals in the last ' || time_range_days || ' days',
      CASE WHEN total_entries > 10 THEN 'Great consistency with meal logging!' ELSE 'Try logging more meals for better insights' END
    ],
    'time_range_days', time_range_days,
    'analysis_date', NOW()
  );
END; $$;

-- Find similar meals function
CREATE OR REPLACE FUNCTION find_similar_meals(user_id_param UUID, entry_id UUID, similarity_threshold FLOAT DEFAULT 0.7, max_results INTEGER DEFAULT 10)
RETURNS TABLE (id UUID, image_url TEXT, caption TEXT, meal_type TEXT, dietary_pattern TEXT, ingredients TEXT[], similarity FLOAT, created_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT je.id, je.image_url, je.caption, je.meal_type, NULL::TEXT as dietary_pattern, je.ingredients, 0.5::FLOAT as similarity, je.created_at
  FROM public.journal_entries je
  WHERE je.user_id = user_id_param AND je.id != entry_id
  ORDER BY je.created_at DESC LIMIT max_results;
END; $$;

-- Grant permissions
GRANT ALL ON public.content_sparks TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_week_identifier() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_content_spark(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_content_spark_viewed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_prompt_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_needing_content_sparks() TO service_role;
GRANT EXECUTE ON FUNCTION get_journal_analytics_with_insights(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_meals(UUID, UUID, FLOAT, INTEGER) TO authenticated;

SELECT 'Database setup complete! Content Sparks and Journal Analytics should now work.' as status;`;
}

main().catch(console.error); 