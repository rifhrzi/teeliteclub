-- DEBUG PRODUCTS QUERY
-- Run this to see exactly what's wrong with products

-- 1. Check products table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Check product_sizes table structure  
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'product_sizes' 
ORDER BY ordinal_position;

-- 3. Count products
SELECT 'Total products:' as info, COUNT(*) as count FROM public.products;
SELECT 'Active products:' as info, COUNT(*) as count FROM public.products WHERE is_active = true;

-- 4. Show sample products
SELECT id, name, price, is_active, created_at FROM public.products LIMIT 5;

-- 5. Count product sizes
SELECT 'Total product sizes:' as info, COUNT(*) as count FROM public.product_sizes;

-- 6. Test the exact query from Shop.tsx
SELECT 
  p.id, p.name, p.price, p.image_url, p.category, p.description, p.is_active, p.created_at,
  ps.ukuran, ps.stok
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 5;

-- 7. Check for foreign key issues
SELECT 
  tc.constraint_name,
  tc.table_name,
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
  AND tc.table_name IN ('products', 'product_sizes');

-- 8. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('products', 'product_sizes');

SELECT '🔍 DEBUG COMPLETE - Check the results above' as status;
