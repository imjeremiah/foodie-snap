/**
 * Test script for the nutrition scan Edge Function
 * This script tests the scan-nutrition-label function with a sample image URL
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '../../.env.local' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  process.exit(1);
}

// Sample food image URL for testing (you can replace with any food image URL)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

// Test credentials - you can create a test user in your Supabase dashboard
const TEST_EMAIL = 'test@foodiesnap.com';
const TEST_PASSWORD = 'testpassword123';

async function testNutritionScan() {
  console.log('🧪 Testing Nutrition Scan Edge Function...\n');

  try {
    // First, sign in to get an access token
    console.log('🔐 Signing in test user...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!authResponse.ok) {
      console.log('⚠️  Test user not found, creating one...');
      
      // Try to create the test user
      const signUpResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      if (!signUpResponse.ok) {
        const signUpError = await signUpResponse.text();
        console.error('❌ Failed to create test user:', signUpError);
        return;
      }

      console.log('✅ Test user created successfully');
      
      // Now sign in with the new user
      const newAuthResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      if (!newAuthResponse.ok) {
        console.error('❌ Failed to sign in after creating user');
        return;
      }

      const authData = await newAuthResponse.json();
      var accessToken = authData.access_token;
    } else {
      const authData = await authResponse.json();
      var accessToken = authData.access_token;
    }

    console.log('✅ Authentication successful');

    console.log('📡 Calling scan-nutrition-label function...');
    console.log('🖼️  Test image:', TEST_IMAGE_URL);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-nutrition-label`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        imageUri: TEST_IMAGE_URL,
        context: {
          scanType: 'food_item'
        }
      }),
    });

    console.log('📊 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Nutrition scan successful!\n');
      console.log('🍎 Food Name:', result.nutritionCard?.foodName);
      console.log('📈 Confidence:', Math.round((result.nutritionCard?.confidence || 0) * 100) + '%');
      console.log('⏱️  Processing Time:', result.processingTime + 'ms');
      
      if (result.nutritionCard?.nutritionFacts) {
        console.log('\n📊 Nutrition Facts:');
        const facts = result.nutritionCard.nutritionFacts;
        if (facts.calories) console.log('  • Calories:', facts.calories);
        if (facts.protein) console.log('  • Protein:', facts.protein + 'g');
        if (facts.carbs) console.log('  • Carbs:', facts.carbs + 'g');
        if (facts.fat) console.log('  • Fat:', facts.fat + 'g');
      }

      if (result.nutritionCard?.healthInsights?.length > 0) {
        console.log('\n💡 Health Insights:');
        result.nutritionCard.healthInsights.forEach((insight, i) => {
          console.log(`  ${i + 1}. ${insight}`);
        });
      }

      if (result.nutritionCard?.recipeIdeas?.length > 0) {
        console.log('\n🍳 Recipe Ideas:');
        result.nutritionCard.recipeIdeas.forEach((recipe, i) => {
          console.log(`  ${i + 1}. ${recipe}`);
        });
      }
    } else {
      console.error('❌ Nutrition scan failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testNutritionScan(); 