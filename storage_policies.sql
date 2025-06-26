
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload own files" ON storage.objects 
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can view their own files  
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Public read access for profile avatars and shared content
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

