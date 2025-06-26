-- Setup photos bucket for FoodieSnap with proper video and image support
-- This migration configures storage for both photos and videos

-- Create photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos', 
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/mov'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp', 
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/mov'
  ];

-- Grant necessary permissions on the bucket
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO service_role;
