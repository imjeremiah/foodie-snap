-- Storage RLS Policies for FoodieSnap Photo Sharing
-- These policies secure photo uploads and access

-- Drop existing policies if they exist (in case of re-running)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Policy 1: Users can upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view accessible photos
-- (their own photos or photos shared with them through messages)
CREATE POLICY "Users can view accessible photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos' AND (
    -- Own photos
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Photos in messages they can access
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid() 
      AND m.image_url LIKE '%' || name || '%'
    )
  )
);

-- Policy 3: Users can update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
); 