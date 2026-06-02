-- Migration: Add visual styling columns to posts table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This adds nullable columns with defaults, preserving all existing data

-- 1. Add paper_type column (nullable, default 'a4')
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS paper_type TEXT DEFAULT 'a4';

-- 2. Add paper_color column (nullable, no default - will use palette based on paper_type)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS paper_color TEXT DEFAULT NULL;

-- 3. Add attachment_type column (nullable, default 'masking_tape')
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'masking_tape';

-- 4. Add rotation_deg column (nullable, default 0)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS rotation_deg NUMERIC DEFAULT 0;

-- 5. Add image_url column (nullable, for optional image attachments)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Verify columns were added (optional - run separately to check)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'posts' 
-- AND column_name IN ('paper_type', 'paper_color', 'attachment_type', 'rotation_deg', 'image_url');
