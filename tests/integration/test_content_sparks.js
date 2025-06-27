/**
 * Test script for Content Sparks system (User Story #2)
 * This script helps test the weekly content spark generation functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContentSparks() {
  console.log('🔵 Testing Content Sparks System\n');

  try {
    // Test 1: Check database functions
    console.log('1. Testing database functions...');
    
    const { data: weekId, error: weekError } = await supabase
      .rpc('get_current_week_identifier');
      
    if (weekError) {
      console.error('❌ Week identifier function failed:', weekError);
      return;
    }
    
    console.log('✅ Current week identifier:', weekId);

    // Test 2: Get users needing content sparks
    console.log('\n2. Checking users who need content sparks...');
    
    const { data: users, error: usersError } = await supabase
      .rpc('get_users_needing_content_sparks');
      
    if (usersError) {
      console.error('❌ Users query failed:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users?.length || 0} users needing content sparks`);
    if (users && users.length > 0) {
      console.log('   Sample user:', users[0]?.email);
    }

    // Test 3: Test Edge Function (if we have users)
    if (users && users.length > 0) {
      console.log('\n3. Testing content spark generation...');
      
      const testUserId = users[0].user_id || users[0].id;
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-weekly-content-sparks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: testUserId // Test with first user
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Edge Function failed:', errorText);
          return;
        }

        const result = await response.json();
        console.log('✅ Content spark generation result:', result);
        
        // Test 4: Verify content spark was created
        console.log('\n4. Verifying content spark creation...');
        
        const { data: contentSpark, error: sparkError } = await supabase
          .rpc('get_current_content_spark', { user_id_param: testUserId });
          
        if (sparkError) {
          console.error('❌ Content spark verification failed:', sparkError);
          return;
        }
        
        if (contentSpark && contentSpark.length > 0) {
          console.log('✅ Content spark created successfully!');
          console.log('   Prompts generated:', contentSpark[0].prompts?.length || 0);
          console.log('   Sample prompt:', contentSpark[0].prompts?.[0]?.title || 'None');
        } else {
          console.log('⚠️ No content spark found after generation');
        }
        
      } catch (fetchError) {
        console.error('❌ Network error calling Edge Function:', fetchError.message);
      }
    } else {
      console.log('\n⚠️ No users found who need content sparks. This could mean:');
      console.log('   - All users already have content sparks for this week');
      console.log('   - No users have completed onboarding');
      console.log('   - All users have disabled content spark notifications');
    }

    // Test 5: Test database interaction functions
    console.log('\n5. Testing database interaction functions...');
    
    // Test marking as viewed (with a dummy ID)
    const { data: viewResult, error: viewError } = await supabase
      .rpc('mark_content_spark_viewed', { content_spark_id: '00000000-0000-0000-0000-000000000000' });
      
    // This should fail gracefully (no such ID), but function should exist
    if (viewError && !viewError.message.includes('could not be found')) {
      console.error('❌ mark_content_spark_viewed function issue:', viewError);
    } else {
      console.log('✅ mark_content_spark_viewed function exists and works');
    }

    console.log('\n🎉 Content Sparks system testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Helper function to test manual generation
async function generateContentSparksForAllUsers() {
  console.log('🔵 Generating content sparks for all users...\n');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-weekly-content-sparks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generateForAllUsers: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Bulk generation failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Bulk generation result:', result);
    
  } catch (error) {
    console.error('❌ Bulk generation error:', error);
  }
}

// Run based on command line argument
const command = process.argv[2];

if (command === 'generate-all') {
  generateContentSparksForAllUsers();
} else {
  testContentSparks();
}

console.log('\nUsage:');
console.log('  node test_content_sparks.js           # Run full test suite');
console.log('  node test_content_sparks.js generate-all  # Generate for all users'); 