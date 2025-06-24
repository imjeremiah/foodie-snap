-- Journal Content Management Migration
-- This migration creates the journal content system for storing user snaps and content history

-- Create journal_entries table for user content/snaps
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content metadata
  image_url TEXT NOT NULL,
  thumbnail_url TEXT, -- Optional smaller version for grid display
  content_type TEXT CHECK (content_type IN ('photo', 'video')) DEFAULT 'photo',
  caption TEXT,
  
  -- Sharing metadata
  shared_to_chat BOOLEAN DEFAULT false,
  shared_to_story BOOLEAN DEFAULT false,
  shared_to_spotlight BOOLEAN DEFAULT false,
  original_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  -- Content categorization and search
  tags TEXT[], -- Array of tags for categorization
  extracted_text TEXT, -- For future OCR functionality
  
  -- Technical metadata
  file_size INTEGER, -- In bytes
  dimensions JSONB, -- {width: number, height: number}
  location_data JSONB, -- {lat: number, lng: number, name: string} - optional
  
  -- Organization
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  folder_name TEXT, -- Optional user-defined folder organization
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on journal_entries table
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on journal_entries
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_content_type ON public.journal_entries(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_favorites ON public.journal_entries(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_journal_entries_archived ON public.journal_entries(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON public.journal_entries USING GIN(tags);

-- Function to auto-save content to journal when shared
CREATE OR REPLACE FUNCTION public.auto_save_to_journal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-save if user has auto_save_to_journal enabled
  IF EXISTS (
    SELECT 1 FROM public.user_preferences 
    WHERE user_id = NEW.sender_id 
    AND auto_save_to_journal = true
  ) AND NEW.image_url IS NOT NULL THEN
    
    -- Insert into journal_entries if not already exists
    INSERT INTO public.journal_entries (
      user_id,
      image_url,
      content_type,
      shared_to_chat,
      original_message_id,
      created_at
    )
    VALUES (
      NEW.sender_id,
      NEW.image_url,
      CASE 
        WHEN NEW.message_type = 'image' THEN 'photo'
        ELSE 'photo' -- Default for now, can be extended for video
      END,
      true,
      NEW.id,
      NEW.created_at
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicates if entry already exists
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically save content to journal when messages with images are sent
CREATE OR REPLACE TRIGGER on_message_image_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW 
  WHEN (NEW.image_url IS NOT NULL)
  EXECUTE FUNCTION public.auto_save_to_journal();

-- Function to get journal entries with filtering and pagination
CREATE OR REPLACE FUNCTION public.get_journal_entries(
  filter_type TEXT DEFAULT 'all',
  search_term TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS SETOF public.journal_entries AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.journal_entries
  WHERE user_id = auth.uid()
    AND (filter_type = 'all' OR 
         (filter_type = 'favorites' AND is_favorite = true) OR
         (filter_type = 'photos' AND content_type = 'photo') OR
         (filter_type = 'videos' AND content_type = 'video') OR
         (filter_type = 'shared' AND (shared_to_chat = true OR shared_to_story = true OR shared_to_spotlight = true)))
    AND (search_term IS NULL OR 
         caption ILIKE '%' || search_term || '%' OR 
         extracted_text ILIKE '%' || search_term || '%' OR
         search_term = ANY(tags))
    AND is_archived = false
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION public.toggle_journal_favorite(entry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  new_favorite_status BOOLEAN;
BEGIN
  UPDATE public.journal_entries
  SET is_favorite = NOT is_favorite,
      updated_at = NOW()
  WHERE id = entry_id 
    AND user_id = auth.uid()
  RETURNING is_favorite INTO new_favorite_status;
  
  RETURN COALESCE(new_favorite_status, false);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to organize entries into folders
CREATE OR REPLACE FUNCTION public.organize_journal_entry(
  entry_id UUID,
  new_folder_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.journal_entries
  SET folder_name = new_folder_name,
      updated_at = NOW()
  WHERE id = entry_id 
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER; 