
-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('resources', 'resources', true, 104857600, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']);

-- Create storage policies for avatars (public read, authenticated upload)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for documents (private, user-specific)
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policies for resources (public read, authenticated upload)
CREATE POLICY "Resources are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own resources" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resources" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add avatar_url column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add file_size column to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Add storage_path column to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Update resources table to include better metadata
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Create user_documents table for tracking personal documents
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT DEFAULT 'general',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_documents
CREATE POLICY "Users can view their own documents" ON public.user_documents
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own documents" ON public.user_documents
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own documents" ON public.user_documents
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own documents" ON public.user_documents
  FOR DELETE USING (user_id = get_current_user_id());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
