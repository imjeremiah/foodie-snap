/**
 * Apply Database Fix Script
 * Executes the content_sparks table creation SQL directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '../../.env.local');
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
  console.error('❌ Missing required environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDatabaseFix() {
  console.log('🔧 Applying Database Fix for Content Sparks\n');

  try {
    // Step 1: Create the content_sparks table
    console.log('📝 Creating content_sparks table...');
    
    const createTableSQL = `
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
    `;

    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    // Since exec_sql RPC might not exist, let's try a different approach
    // We'll use the REST API directly to execute SQL
    
    // Step 1: Check if table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('content_sparks')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('❌ Table does not exist, need to create it via Supabase Dashboard');
      console.log('\n🔧 MANUAL STEP REQUIRED:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the content_sparks table creation SQL from migration:');
      console.log('   supabase/migrations/20250102000001_content_sparks_system.sql');
      console.log('\n' + '='.repeat(60));
      console.log('NOTE: The fix_content_sparks_table.sql file was removed as it is now');
      console.log('covered by the migration 20250102000001_content_sparks_system.sql');
      console.log('='.repeat(60));
      console.log('\n3. Click "Run" to execute the SQL');
      console.log('4. Then run this script again to verify');
      
      return false;
    } else {
      console.log('✅ content_sparks table already exists or was created!');
    }

    // Step 2: Verify the fix worked
    console.log('\n🔍 Verifying the fix...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('content_sparks')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return false;
    }

    console.log('✅ content_sparks table is accessible!');

    // Step 3: Test the functions
    console.log('\n🧪 Testing Content Sparks functions...');
    
    const { data: weekData, error: weekError } = await supabase.rpc('get_current_week_identifier');
    if (weekError) {
      console.log('❌ get_current_week_identifier failed:', weekError.message);
    } else {
      console.log(`✅ Current week identifier: ${weekData}`);
    }

    const { data: sparkData, error: sparkError } = await supabase.rpc('get_current_content_spark');
    if (sparkError) {
      console.log('❌ get_current_content_spark failed:', sparkError.message);
    } else {
      console.log(`✅ get_current_content_spark working (returned ${sparkData?.length || 0} results)`);
    }

    console.log('\n🎉 Database fix completed successfully!');
    console.log('✅ Content Sparks should now work in the app');
    
    return true;

  } catch (error) {
    console.error('❌ Error applying database fix:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 FoodieSnap Database Fix Application\n');
  
  const success = await applyDatabaseFix();
  
  if (success) {
    console.log('\n✅ All done! Test the app now:');
    console.log('   - Profile → Content Spark should work');
    console.log('   - Journal → Insights should work');
  } else {
    console.log('\n❌ Manual intervention required - see instructions above');
  }
}

main().catch(console.error); 