-- Migration: Create storage bucket for post images
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates a public bucket for storing poster images

-- 1. Create the 'posts' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Create policy to allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- 3. Create policy to allow authenticated/anon insert (for uploading)
CREATE POLICY IF NOT EXISTS "Allow image uploads to posts bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'posts');

-- Note: After running this migration:
-- 1. Images will be uploaded to: posts/poster-images/filename.ext
-- 2. Public URL format: https://[project].supabase.co/storage/v1/object/public/posts/poster-images/filename.ext
-- 3. Old blob URLs in existing posts will not work - those posts need to be re-uploaded

-- Alternative: Create bucket via Supabase Dashboard
-- 1. Go to Storage in sidebar
-- 2. Click "New bucket"
-- 3. Name: "posts"
-- 4. Check "Public bucket"
-- 5. Set file size limit: 5MB
-- 6. Add policies for public read and insert
