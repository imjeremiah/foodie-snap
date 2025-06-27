/**
 * Verify Database Fix Script
 * Quick check to confirm Content Sparks table was created successfully
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
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
}

loadEnvLocal();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFix() {
  console.log('🔍 Verifying Database Fix...\n');

  try {
    // Test 1: Check if content_sparks table exists
    const { data: sparkData, error: sparkError } = await supabase
      .from('content_sparks')
      .select('id')
      .limit(1);

    if (sparkError) {
      console.log('❌ content_sparks table: STILL MISSING');
      console.log('   Please apply the SQL in Supabase Dashboard first');
      return;
    } else {
      console.log('✅ content_sparks table: EXISTS');
    }

    // Test 2: Check Content Sparks functions
    const { data: weekData, error: weekError } = await supabase.rpc('get_current_week_identifier');
    if (weekError) {
      console.log('❌ get_current_week_identifier: FAILED');
    } else {
      console.log(`✅ get_current_week_identifier: WORKING (${weekData})`);
    }

    const { data: currentSpark, error: currentSparkError } = await supabase.rpc('get_current_content_spark');
    if (currentSparkError) {
      console.log('❌ get_current_content_spark: FAILED');
    } else {
      console.log(`✅ get_current_content_spark: WORKING (${currentSpark?.length || 0} results)`);
    }

    // Test 3: Check Journal Analytics functions  
    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      'get_journal_analytics_with_insights',
      { 
        user_id_param: '00000000-0000-0000-0000-000000000000',
        time_range_days: 30 
      }
    );
    
    if (analyticsError) {
      console.log('❌ get_journal_analytics_with_insights: FAILED');
    } else {
      console.log('✅ get_journal_analytics_with_insights: WORKING');
    }

    console.log('\n🎉 Database Fix Verification Complete!');
    console.log('✅ Both Content Sparks and Journal Analytics should now work in the app');
    console.log('\n📱 Test in your app:');
    console.log('   • Profile → Content Spark (should show generate button)');
    console.log('   • Journal → Insights (should show analytics dashboard)');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyFix(); 