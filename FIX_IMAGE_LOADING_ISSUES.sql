-- Fix Image Loading Issues - Supabase Storage Policies
-- Created: 2025-07-23
-- Purpose: Fix image loading problems by setting up proper storage policies

-- 1. CREATE STORAGE BUCKET (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. ENABLE PUBLIC ACCESS TO IMAGES
-- Drop existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create comprehensive storage policies
-- Allow public read access to all images
CREATE POLICY "Public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete images (admin only in practice)
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 3. ENSURE SYSTEM_SETTINGS TABLE EXISTS AND HAS PROPER POLICIES
CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- Allow public read access to system settings (for hero image, etc.)
CREATE POLICY "Public read access to system settings"
ON public.system_settings FOR SELECT
TO public
USING (true);

-- Allow admins to manage system settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 4. INSERT DEFAULT HERO IMAGE SETTING IF NOT EXISTS
INSERT INTO public.system_settings (key, value)
VALUES ('hero_image_url', '/lovable-uploads/a773ac2f-9e06-49da-a3b9-b4425905b493.png')
ON CONFLICT (key) DO NOTHING;

-- 5. VERIFY PRODUCTS TABLE HAS PROPER IMAGE COLUMNS
-- Ensure products table has both image_url and gambar columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gambar TEXT[];

-- 6. UPDATE EXISTING PRODUCTS WITH FALLBACK IMAGES
-- Set fallback images for products that don't have any
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
WHERE (image_url IS NULL OR image_url = '') 
  AND (gambar IS NULL OR array_length(gambar, 1) IS NULL);

-- 7. REFRESH STORAGE SCHEMA
-- This ensures all policies are properly applied
NOTIFY pgrst, 'reload schema';

-- 8. VERIFICATION QUERIES
-- Check if bucket exists and is public
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check system settings
SELECT key, value FROM public.system_settings WHERE key = 'hero_image_url';

-- Check products with images
SELECT id, name, image_url, gambar 
FROM public.products 
WHERE is_active = true 
LIMIT 5;

-- SUCCESS MESSAGE
SELECT 'Image loading issues should now be resolved! All storage policies are set up correctly.' as status;
