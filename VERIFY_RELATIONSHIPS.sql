-- COMPREHENSIVE RELATIONSHIP VERIFICATION
-- Run this after the relationship fix to verify everything works

-- ========================================
-- 1. TABLE STRUCTURE VERIFICATION
-- ========================================

-- Check products table structure
SELECT 
  'PRODUCTS TABLE STRUCTURE' as section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check product_sizes table structure  
SELECT 
  'PRODUCT_SIZES TABLE STRUCTURE' as section,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'product_sizes' 
ORDER BY ordinal_position;

-- ========================================
-- 2. FOREIGN KEY RELATIONSHIPS VERIFICATION
-- ========================================

SELECT 
  'FOREIGN KEY RELATIONSHIPS' as section,
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('products', 'product_sizes', 'order_items', 'cart_items')
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- 3. DATA VERIFICATION
-- ========================================

-- Count records in each table
SELECT 'DATA COUNTS' as section, 'products' as table_name, COUNT(*) as count FROM public.products;
SELECT 'DATA COUNTS' as section, 'active_products' as table_name, COUNT(*) as count FROM public.products WHERE is_active = true;
SELECT 'DATA COUNTS' as section, 'product_sizes' as table_name, COUNT(*) as count FROM public.product_sizes;
SELECT 'DATA COUNTS' as section, 'profiles' as table_name, COUNT(*) as count FROM public.profiles;

-- Show sample data
SELECT 
  'SAMPLE PRODUCTS' as section,
  id, name, price, is_active, created_at, image_url IS NOT NULL as has_image
FROM public.products 
WHERE is_active = true
LIMIT 5;

-- Show sample product sizes
SELECT 
  'SAMPLE PRODUCT SIZES' as section,
  ps.id, ps.product_id, ps.ukuran, ps.stok, p.name as product_name
FROM public.product_sizes ps
JOIN public.products p ON ps.product_id = p.id
LIMIT 10;

-- ========================================
-- 4. QUERY TESTING - EXACT SHOP.TSX QUERY
-- ========================================

-- Test the exact query used in Shop.tsx
SELECT 
  'SHOP QUERY TEST' as section,
  p.id, p.name, p.price, p.image_url, p.category, p.description, p.is_active, p.created_at,
  json_agg(
    json_build_object(
      'ukuran', ps.ukuran,
      'stok', ps.stok
    )
  ) as product_sizes
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.price, p.image_url, p.category, p.description, p.is_active, p.created_at
ORDER BY p.created_at DESC
LIMIT 3;

-- ========================================
-- 5. AUTHENTICATION QUERY TESTING
-- ========================================

-- Test profile query that was failing
SELECT 
  'PROFILE QUERY TEST' as section,
  id, email, role, full_name, phone, address
FROM public.profiles 
WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3';

-- ========================================
-- 6. RLS POLICY VERIFICATION
-- ========================================

-- Check RLS policies on key tables
SELECT 
  'RLS POLICIES' as section,
  schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('products', 'product_sizes', 'profiles', 'system_settings')
ORDER BY tablename, policyname;

-- ========================================
-- 7. STORAGE VERIFICATION
-- ========================================

-- Check storage bucket
SELECT 
  'STORAGE BUCKET' as section,
  id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Check storage policies
SELECT 
  'STORAGE POLICIES' as section,
  schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ========================================
-- 8. SYSTEM SETTINGS VERIFICATION
-- ========================================

-- Check system settings
SELECT 
  'SYSTEM SETTINGS' as section,
  key, LEFT(value, 100) as value_preview
FROM public.system_settings;

-- ========================================
-- 9. RELATIONSHIP JOIN TESTING
-- ========================================

-- Test complex joins that the app uses
SELECT 
  'COMPLEX JOIN TEST' as section,
  p.name as product_name,
  COUNT(ps.id) as size_count,
  SUM(ps.stok) as total_stock,
  ARRAY_AGG(ps.ukuran ORDER BY ps.ukuran) as available_sizes
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.name
LIMIT 5;

-- ========================================
-- 10. ERROR CHECKING
-- ========================================

-- Check for orphaned records
SELECT 
  'ORPHANED RECORDS CHECK' as section,
  'product_sizes without products' as issue,
  COUNT(*) as count
FROM public.product_sizes ps
LEFT JOIN public.products p ON ps.product_id = p.id
WHERE p.id IS NULL;

-- Check for products without sizes
SELECT 
  'PRODUCTS WITHOUT SIZES' as section,
  p.name,
  p.id
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true AND ps.id IS NULL;

-- ========================================
-- 11. FINAL STATUS
-- ========================================

-- Summary report
SELECT 
  'VERIFICATION SUMMARY' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.products WHERE is_active = true) > 0 
      AND (SELECT COUNT(*) FROM public.product_sizes) > 0
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = '03006849-b875-4fc2-989d-8f34fc8653b3' AND full_name IS NOT NULL)
      AND EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images' AND public = true)
    THEN '✅ ALL SYSTEMS OPERATIONAL'
    ELSE '❌ ISSUES DETECTED - CHECK ABOVE RESULTS'
  END as status;

-- Test connection from application perspective
SELECT 
  'APPLICATION TEST' as section,
  'If you see this message, your database connection is working!' as message,
  NOW() as timestamp;
