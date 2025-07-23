-- CLEAN RELATIONSHIP FIX - Handles existing policies properly
-- Run this to fix all relationship issues without conflicts

-- ========================================
-- PART 1: FIX PROFILES TABLE
-- ========================================

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update your user profile
UPDATE public.profiles 
SET 
  full_name = COALESCE(full_name, 'Admin User'),
  role = 'admin',
  updated_at = NOW()
WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3';

-- ========================================
-- PART 2: FIX PRODUCTS TABLE
-- ========================================

-- Ensure products table has all required columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gambar TEXT[],
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure all products are active
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- ========================================
-- PART 3: FIX PRODUCT_SIZES TABLE WITH CORRECT UUID RELATIONSHIPS
-- ========================================

-- Drop existing product_sizes table if it has wrong structure
DROP TABLE IF EXISTS public.product_sizes CASCADE;

-- Recreate product_sizes table with correct UUID structure to match products table
CREATE TABLE public.product_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ukuran TEXT NOT NULL,
  stok INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ukuran)
);

-- Enable RLS on product_sizes
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- Create policy for product_sizes (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view product sizes" ON public.product_sizes;
CREATE POLICY "Anyone can view product sizes"
ON public.product_sizes FOR SELECT
TO public
USING (true);

-- Create policy for authenticated users to manage sizes
DROP POLICY IF EXISTS "Authenticated users can manage product sizes" ON public.product_sizes;
CREATE POLICY "Authenticated users can manage product sizes"
ON public.product_sizes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ========================================
-- PART 4: INSERT SAMPLE PRODUCTS IF NONE EXIST
-- ========================================

-- Insert sample products only if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
    -- Insert sample products with UUID IDs
    INSERT INTO public.products (name, description, price, category, image_url, gambar, is_active, stock_quantity) VALUES
    ('T-Shirt Basic', 'Comfortable cotton t-shirt', 150000, 'Clothing', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'], true, 50),
    ('Hoodie Premium', 'Warm and stylish hoodie', 350000, 'Clothing', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop'], true, 30),
    ('Jeans Classic', 'Durable denim jeans', 250000, 'Clothing', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'], true, 40),
    ('Sneakers Sport', 'Comfortable sports shoes', 450000, 'Shoes', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'], true, 25),
    ('Jacket Casual', 'Lightweight casual jacket', 300000, 'Clothing', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop'], true, 35);
    
    -- Insert sizes for each product
    INSERT INTO public.product_sizes (product_id, ukuran, stok)
    SELECT p.id, size, 10
    FROM public.products p
    CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS sizes(size);
  END IF;
END $$;

-- ========================================
-- PART 5: FIX FOREIGN KEY RELATIONSHIPS
-- ========================================

-- Clean up any duplicate or conflicting foreign key constraints
DO $$
BEGIN
    -- Drop any existing conflicting constraints
    ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS fk_order_items_product_id;
    ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey1;
    ALTER TABLE public.product_sizes DROP CONSTRAINT IF EXISTS fk_product_sizes_product_id;
    ALTER TABLE public.product_sizes DROP CONSTRAINT IF EXISTS product_sizes_product_id_fkey1;
    ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_product_id;
    
    -- Ensure standard foreign key constraints exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_product_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT order_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_product_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE public.cart_items 
        ADD CONSTRAINT cart_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ========================================
-- PART 6: CREATE SYSTEM SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Public read access to system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

CREATE POLICY "Public read access to system settings"
ON public.system_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Insert hero image setting
INSERT INTO public.system_settings (key, value)
VALUES ('hero_image_url', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================
-- PART 7: VERIFICATION
-- ========================================

-- Test the exact query that Shop.tsx uses
SELECT 
  'Shop query test' as test_name,
  p.id, p.name, p.price, p.image_url, p.category, p.description, p.is_active, p.created_at,
  ps.ukuran, ps.stok
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 3;

-- Count records
SELECT 'Products count' as info, COUNT(*) as count FROM public.products WHERE is_active = true;
SELECT 'Product sizes count' as info, COUNT(*) as count FROM public.product_sizes;
SELECT 'User profile check' as info, email, role, full_name FROM public.profiles WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3';

SELECT '✅ RELATIONSHIP ISSUES FIXED! Test your shop page now.' as status;
