-- Setup Supabase Storage for FoodieSnap
-- Note: Storage bucket and RLS policies need to be set up manually in Supabase Dashboard
-- or using Supabase CLI storage commands

-- Create storage bucket for photos (if not exists)
-- This may fail if bucket already exists, which is fine
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies are managed through Supabase Dashboard
-- The following policies should be created in the Supabase Dashboard:

-- Policy: "Users can upload their own photos"
-- ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'photos' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: "Users can view accessible photos"
-- ON storage.objects FOR SELECT USING (
--   bucket_id = 'photos' AND (
--     auth.uid()::text = (storage.foldername(name))[1] OR
--     EXISTS (
--       SELECT 1 FROM public.messages m
--       JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
--       WHERE cp.user_id = auth.uid() 
--       AND m.image_url LIKE '%' || name || '%'
--     )
--   )
-- );

-- Policy: "Users can update their own photos"
-- ON storage.objects FOR UPDATE USING (
--   bucket_id = 'photos' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: "Users can delete their own photos"  
-- ON storage.objects FOR DELETE USING (
--   bucket_id = 'photos' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- ); 