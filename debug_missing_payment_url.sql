-- Debug query to investigate missing payment_url issue
-- Order ID: 570564ce-ef67-4dc3-95c1-ae654f2b2e7c
-- User: sultannfaturahman@gmail.com (03006849-b875-4fc2-989d-8f34fc8653b3)

-- 1. Check the specific problematic order
SELECT 
    id,
    order_number,
    user_id,
    status,
    payment_url,
    payment_method,
    tracking_number,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'pending' AND payment_url IS NOT NULL THEN '✅ BUTTON_SHOULD_SHOW'
        WHEN status = 'pending' AND payment_url IS NULL THEN '❌ MISSING_PAYMENT_URL'
        ELSE '⚪ NOT_PENDING'
    END as button_status
FROM orders 
WHERE id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c';

-- 2. Check all pending orders missing payment_url
SELECT 
    id,
    order_number,
    user_id,
    status,
    payment_url IS NOT NULL as has_payment_url,
    payment_method,
    created_at,
    updated_at
FROM orders 
WHERE status = 'pending' AND payment_url IS NULL
ORDER BY created_at DESC;

-- 3. Check when payment_url field was added vs order creation dates
SELECT 
    'Orders created before payment_url field' as category,
    COUNT(*) as count
FROM orders 
WHERE created_at < '2025-07-20 14:00:00'::timestamp
    AND status = 'pending'
    AND payment_url IS NULL

UNION ALL

SELECT 
    'Orders created after payment_url field' as category,
    COUNT(*) as count
FROM orders 
WHERE created_at >= '2025-07-20 14:00:00'::timestamp
    AND status = 'pending'
    AND payment_url IS NULL;

-- 4. Check if there are any payment records for this order
SELECT 
    p.id as payment_id,
    p.order_id,
    p.amount,
    p.status as payment_status,
    p.payment_proof,
    p.created_at as payment_created,
    o.order_number,
    o.status as order_status,
    o.payment_url
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE o.id = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c';

-- 5. Check user's order history to understand the pattern
SELECT 
    id,
    order_number,
    status,
    payment_url IS NOT NULL as has_payment_url,
    payment_method,
    created_at
FROM orders 
WHERE user_id = '03006849-b875-4fc2-989d-8f34fc8653b3'
ORDER BY created_at DESC;

-- 6. Check if tracking_number contains Midtrans token (temporary storage)
SELECT 
    id,
    order_number,
    status,
    payment_url,
    tracking_number,
    CASE 
        WHEN tracking_number IS NOT NULL AND payment_url IS NULL THEN '🔧 MIGHT_NEED_RECOVERY'
        WHEN tracking_number IS NOT NULL AND payment_url IS NOT NULL THEN '✅ BOTH_PRESENT'
        WHEN tracking_number IS NULL AND payment_url IS NULL THEN '❌ BOTH_MISSING'
        ELSE '⚪ OTHER'
    END as recovery_status
FROM orders 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;

-- 7. Summary statistics
SELECT 
    status,
    COUNT(*) as total_orders,
    COUNT(payment_url) as orders_with_payment_url,
    COUNT(*) - COUNT(payment_url) as orders_missing_payment_url,
    ROUND(
        (COUNT(payment_url)::decimal / COUNT(*)) * 100, 
        2
    ) as percentage_with_payment_url
FROM orders 
GROUP BY status
ORDER BY total_orders DESC;
