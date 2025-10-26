<<<<<<< HEAD
-- Update recent pending orders to paid status for testing
UPDATE orders 
SET status = 'paid', updated_at = NOW()
WHERE status = 'pending' AND payment_method = 'midtrans' 
=======
-- Update recent pending orders to paid status for testing
UPDATE orders 
SET status = 'paid', updated_at = NOW()
WHERE status = 'pending' AND payment_method = 'midtrans' 
>>>>>>> c78eca0 (Update Maintenance)
AND created_at > NOW() - INTERVAL '1 hour';