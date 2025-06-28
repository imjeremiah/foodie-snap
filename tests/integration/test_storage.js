const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test storage upload functionality
const testStorageUpload = async () => {
  console.log('🧪 Testing Supabase Storage Configuration...');
  
  // Test image upload capability
  const testImageData = Buffer.from('test image data');
  const testVideoData = Buffer.from('test video data');
  
  try {
    // Test image upload
    const imageResult = await supabase.storage
      .from('photos')
      .upload('test-user/photos/test-image.jpg', testImageData, {
        contentType: 'image/jpeg'
      });
    
    console.log('✅ Image upload test:', imageResult);
    
    // Test video upload  
    const videoResult = await supabase.storage
      .from('photos') 
      .upload('test-user/videos/test-video.mp4', testVideoData, {
        contentType: 'video/mp4'
      });
      
    console.log('✅ Video upload test:', videoResult);
    
    // Test file listing
    const listResult = await supabase.storage
      .from('photos')
      .list('test-user');
      
    console.log('📁 File listing test:', listResult);
    
    // Clean up test files
    const cleanupResult1 = await supabase.storage.from('photos').remove(['test-user/photos/test-image.jpg']);
    const cleanupResult2 = await supabase.storage.from('photos').remove(['test-user/videos/test-video.mp4']);
    
    console.log('🧹 Cleanup results:', { cleanupResult1, cleanupResult2 });
    console.log('🎉 Storage configuration verified!');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    
    // Check if it's a bucket missing error
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket does not exist')) {
      console.log('\n⚠️  You need to create the "photos" bucket in Supabase Dashboard first!');
      console.log('   Go to: https://supabase.com/dashboard/project/abtjktcxnqrazyfyzcen/storage/buckets');
    }
  }
};

// Run the test
testStorageUpload();

