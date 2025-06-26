-- Storage policies for photos bucket
-- Create RLS policies for secure file uploads and access

-- Allow users to upload files to their own folders
CREATE POLICY "Users can upload own files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to photos bucket (for shared content)
CREATE POLICY "Public read access for photos" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');
