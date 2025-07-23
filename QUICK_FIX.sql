-- QUICK FIX FOR IMMEDIATE ISSUES
-- Run this first to fix the most critical problems

-- ========================================
-- 1. FIX PROFILES TABLE - Add missing full_name column
-- ========================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update your user profile
UPDATE public.profiles 
SET 
  full_name = 'Admin User',
  role = 'admin',
  updated_at = NOW()
WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3';

-- ========================================
-- 2. CHECK AND FIX PRODUCTS TABLE STRUCTURE
-- ========================================

-- Add missing columns if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gambar TEXT[];

-- Ensure all products are active
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- ========================================
-- 3. CREATE SAMPLE PRODUCTS IF NONE EXIST
-- ========================================

-- Insert sample products only if table is empty
INSERT INTO public.products (name, description, price, category, image_url, gambar, is_active, stock_quantity)
SELECT * FROM (VALUES
  ('T-Shirt Basic', 'Comfortable cotton t-shirt', 150000, 'Clothing', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'], true, 50),
  ('Hoodie Premium', 'Warm and stylish hoodie', 350000, 'Clothing', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop'], true, 30),
  ('Jeans Classic', 'Durable denim jeans', 250000, 'Clothing', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'], true, 40),
  ('Sneakers Sport', 'Comfortable sports shoes', 450000, 'Shoes', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'], true, 25),
  ('Jacket Casual', 'Lightweight casual jacket', 300000, 'Clothing', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop'], true, 35)
) AS v(name, description, price, category, image_url, gambar, is_active, stock_quantity)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- ========================================
-- 4. CREATE/FIX PRODUCT_SIZES TABLE
-- ========================================

-- Create product_sizes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  ukuran VARCHAR(10) NOT NULL,
  stok INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ukuran)
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'product_sizes_product_id_fkey'
  ) THEN
    ALTER TABLE public.product_sizes 
    ADD CONSTRAINT product_sizes_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on product_sizes
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- Create policy for product_sizes
DROP POLICY IF EXISTS "Anyone can view product sizes" ON public.product_sizes;
CREATE POLICY "Anyone can view product sizes"
ON public.product_sizes FOR SELECT
TO public
USING (true);

-- Insert sizes for products if they don't exist
INSERT INTO public.product_sizes (product_id, ukuran, stok)
SELECT p.id, size, 10
FROM public.products p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS sizes(size)
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_sizes ps 
  WHERE ps.product_id = p.id AND ps.ukuran = sizes.size
);

-- ========================================
-- 5. FIX STORAGE POLICIES FOR IMAGES
-- ========================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create simple public read policy
CREATE POLICY "Public read access to all images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ========================================
-- 6. VERIFICATION
-- ========================================

-- Check results
SELECT 'Products count:' as check_type, COUNT(*) as count FROM public.products WHERE is_active = true;
SELECT 'Product sizes count:' as check_type, COUNT(*) as count FROM public.product_sizes;
SELECT 'User profile:' as check_type, email, role, full_name FROM public.profiles WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3';

-- Test query that the shop page uses
SELECT 
  'Shop query test:' as test,
  COUNT(*) as product_count
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true;

SELECT '✅ QUICK FIX COMPLETE! Test your shop page now.' as status;
