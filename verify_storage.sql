
-- Check if photos bucket exists and is configured correctly
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'photos';

-- Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if bucket can accept videos
SELECT 
  CASE 
    WHEN 'video/mp4' = ANY(allowed_mime_types) THEN '✅ Video support enabled'
    ELSE '❌ Video support missing'
  END as video_support,
  CASE 
    WHEN file_size_limit >= 52428800 THEN '✅ File size limit OK (≥50MB)'
    ELSE '❌ File size limit too small'
  END as size_limit
FROM storage.buckets 
WHERE id = 'photos';

