# Supabase Storage Setup Guide

This guide explains how to set up the storage policies for the FoodieSnap photo sharing system.

## 1. Storage Bucket Setup

The `photos` bucket has been created automatically via migration. If you need to create it manually:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `photos`
3. Set it to **Private** (not public)

## 2. Storage RLS Policies

You need to create the following RLS policies for the `storage.objects` table in the Supabase Dashboard:

### Go to: Authentication → Policies → storage.objects

### Policy 1: "Users can upload their own photos"
- **Operation**: INSERT
- **Policy Definition**:
```sql
bucket_id = 'photos' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 2: "Users can view accessible photos"  
- **Operation**: SELECT
- **Policy Definition**:
```sql
bucket_id = 'photos' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid() 
    AND m.image_url LIKE '%' || name || '%'
  )
)
```

### Policy 3: "Users can update their own photos"
- **Operation**: UPDATE  
- **Policy Definition**:
```sql
bucket_id = 'photos' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 4: "Users can delete their own photos"
- **Operation**: DELETE
- **Policy Definition**:
```sql
bucket_id = 'photos' AND 
auth.uid()::text = (storage.foldername(name))[1]
```

## 3. Testing the Setup

After setting up the policies:

1. Run the app and sign in
2. Take a photo with the camera
3. Try sending it to a conversation
4. Check that the photo appears in the chat

## 4. File Organization

Photos are organized by user ID:
```
photos/
  ├── user_id_1/
  │   ├── timestamp1-random1.jpg
  │   └── timestamp2-random2.jpg
  └── user_id_2/
      ├── timestamp3-random3.jpg
      └── timestamp4-random4.jpg
```

## 5. Security Features

- Users can only upload to their own folder (`user_id/`)
- Users can only view their own photos or photos shared with them in conversations
- All uploads are automatically compressed and optimized
- Files are stored with unique timestamps and random IDs to prevent conflicts 