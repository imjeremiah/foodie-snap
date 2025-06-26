const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://abtjktcxnqrazyfyzcen.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

// Test basic caption generation with minimal payload
const testBasicCaption = async () => {
  console.log('🧪 Testing Basic Caption Generation...');
  
  try {
    // Simple test request without auth complications
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-smart-captions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDescription: 'A healthy bowl of quinoa with vegetables and grilled chicken',
        contentType: 'photo'
      })
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      
      if (response.status === 502) {
        console.log('\n💡 502 Error suggests the function is crashing on startup');
        console.log('   This could be due to:');
        console.log('   1. Missing database functions (get_user_rag_context, search_similar_content)');
        console.log('   2. Database connection issues');
        console.log('   3. Environment variable issues');
      }
    }
    
  } catch (error) {
    console.error('❌ Network/Connection Error:', error.message);
  }
};

// Run the test
testBasicCaption(); 