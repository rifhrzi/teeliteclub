-- Add payment_url field to orders table to store Midtrans payment URL
ALTER TABLE public.orders 
ADD COLUMN payment_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.orders.payment_url IS 'Stores the Midtrans payment URL for incomplete payments';

-- Add index for faster queries on pending payments
CREATE INDEX idx_orders_status_payment_url ON public.orders(status, payment_url) 
WHERE status = 'pending' AND payment_url IS NOT NULL;