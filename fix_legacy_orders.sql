-- Fix Legacy Orders Missing Payment URLs
-- Run this script in Supabase SQL Editor to identify and understand legacy order issues

-- 1. ANALYSIS: Check the scope of the problem
SELECT 
    'ANALYSIS: Legacy Orders Missing Payment URLs' as section,
    '' as details
UNION ALL
SELECT 
    'Total pending orders:',
    COUNT(*)::text
FROM orders 
WHERE status = 'pending'
UNION ALL
SELECT 
    'Pending orders with payment_url:',
    COUNT(*)::text
FROM orders 
WHERE status = 'pending' AND payment_url IS NOT NULL
UNION ALL
SELECT 
    'Pending orders missing payment_url:',
    COUNT(*)::text
FROM orders 
WHERE status = 'pending' AND payment_url IS NULL;

-- 2. DETAILED VIEW: Show problematic orders
SELECT 
    '--- PROBLEMATIC ORDERS ---' as section,
    '' as id,
    '' as order_number,
    '' as user_email,
    '' as created_at,
    '' as age_days
UNION ALL
SELECT 
    'Legacy Order',
    o.id,
    o.order_number,
    COALESCE(p.email, o.email_pembeli, 'No email') as user_email,
    o.created_at::text,
    EXTRACT(days FROM NOW() - o.created_at)::text || ' days'
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.status = 'pending' 
    AND o.payment_url IS NULL
ORDER BY o.created_at DESC;

-- 3. SPECIFIC ORDER: Check the reported problematic order
SELECT 
    '--- SPECIFIC ORDER INVESTIGATION ---' as section,
    '' as detail,
    '' as value
UNION ALL
SELECT 
    'Order ID:',
    '570564ce-ef67-4dc3-95c1-ae654f2b2e7c',
    CASE 
        WHEN EXISTS (SELECT 1 FROM orders WHERE id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c') 
        THEN '✅ EXISTS' 
        ELSE '❌ NOT FOUND' 
    END
UNION ALL
SELECT 
    'Order Status:',
    COALESCE((SELECT status FROM orders WHERE id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c'), 'N/A'),
    ''
UNION ALL
SELECT 
    'Payment URL:',
    CASE 
        WHEN (SELECT payment_url FROM orders WHERE id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c') IS NOT NULL 
        THEN '✅ HAS URL' 
        ELSE '❌ MISSING URL' 
    END,
    ''
UNION ALL
SELECT 
    'Created Date:',
    COALESCE((SELECT created_at::text FROM orders WHERE id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c'), 'N/A'),
    ''
UNION ALL
SELECT 
    'User Email:',
    COALESCE((
        SELECT COALESCE(p.email, o.email_pembeli, u.email, 'No email')
        FROM orders o
        LEFT JOIN auth.users u ON o.user_id = u.id
        LEFT JOIN profiles p ON o.user_id = p.id
        WHERE o.id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c'
    ), 'N/A'),
    '';

-- 4. TIMELINE ANALYSIS: When was payment_url field added vs order creation
SELECT 
    '--- TIMELINE ANALYSIS ---' as category,
    '' as count,
    '' as description
UNION ALL
SELECT 
    'Orders before payment_url field (< July 20, 2025):',
    COUNT(*)::text,
    'These orders were created before payment_url field existed'
FROM orders 
WHERE created_at < '2025-07-20 14:00:00'::timestamp
    AND status = 'pending'
UNION ALL
SELECT 
    'Orders after payment_url field (>= July 20, 2025):',
    COUNT(*)::text,
    'These orders should have payment_url if created properly'
FROM orders 
WHERE created_at >= '2025-07-20 14:00:00'::timestamp
    AND status = 'pending'
    AND payment_url IS NULL;

-- 5. RECOMMENDATIONS
SELECT 
    '--- RECOMMENDATIONS ---' as action,
    '' as description
UNION ALL
SELECT 
    '1. UI Fix Deployed:',
    'Continue Payment button now shows "Pulihkan Pembayaran" for legacy orders'
UNION ALL
SELECT 
    '2. Recovery Function:',
    'recover-payment-url function will create new Midtrans payment for legacy orders'
UNION ALL
SELECT 
    '3. User Action Required:',
    'Users with legacy orders need to click "Pulihkan Pembayaran" button'
UNION ALL
SELECT 
    '4. Alternative Solution:',
    'Contact customer service to manually process legacy orders'
UNION ALL
SELECT 
    '5. Prevention:',
    'All new orders will have payment_url stored correctly';

-- 6. OPTIONAL: Mark very old pending orders as expired (UNCOMMENT TO RUN)
-- WARNING: This will change order status for old orders
-- UPDATE orders 
-- SET status = 'cancelled', updated_at = NOW()
-- WHERE status = 'pending' 
--     AND payment_url IS NULL 
--     AND created_at < NOW() - INTERVAL '7 days'
--     AND id != '570564ce-ef67-4dc3-95c1-ae654f2b2e7c'; -- Keep the reported order for testing
