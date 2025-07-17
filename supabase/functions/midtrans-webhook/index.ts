import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification = await req.json();
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Midtrans notification received:', notification);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let orderStatus = 'pending';

    // Determine order status based on Midtrans notification
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        orderStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      orderStatus = 'paid';
    } else if (transactionStatus === 'cancel' || 
               transactionStatus === 'deny' || 
               transactionStatus === 'expire') {
      orderStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      orderStatus = 'pending';
    }

    // Update order status in database
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    // Create payment record
    const { data: orderData } = await supabaseService
      .from('orders')
      .select('id, total')
      .eq('order_number', orderId)
      .single();

    if (orderData) {
      const { error: paymentError } = await supabaseService
        .from('payments')
        .insert({
          order_id: orderData.id,
          amount: orderData.total,
          status: orderStatus,
          payment_proof: JSON.stringify(notification)
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }
    }

    // If payment is successful, update product stock
    if (orderStatus === 'paid') {
      const { data: orderItems } = await supabaseService
        .from('order_items')
        .select('product_id, jumlah')
        .eq('order_id', orderData?.id);

      if (orderItems) {
        for (const item of orderItems) {
          const { data: product } = await supabaseService
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, product.stock_quantity - item.jumlah);
            
            await supabaseService
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);
          }
        }
      }
    }

    console.log(`Order ${orderId} status updated to: ${orderStatus}`);

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing Midtrans webhook:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});