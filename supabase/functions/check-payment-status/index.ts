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
    const { order_id, transaction_status, status_code } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Midtrans configuration
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const isProduction = Deno.env.get('MIDTRANS_ENVIRONMENT') === 'production';
    const statusUrl = isProduction 
      ? `https://api.midtrans.com/v2/${order_id}/status`
      : `https://api.sandbox.midtrans.com/v2/${order_id}/status`;

    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Check payment status with Midtrans
    const midtransResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`
      }
    });

    if (!midtransResponse.ok) {
      throw new Error('Failed to check payment status');
    }

    const paymentStatus = await midtransResponse.json();

    // Create service client for database updates
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get order from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_number', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or access denied');
    }

    // Update order status based on payment status
    let newOrderStatus = order.status;
    if (paymentStatus.transaction_status === 'settlement' || paymentStatus.transaction_status === 'capture') {
      newOrderStatus = 'paid';
    } else if (paymentStatus.transaction_status === 'pending') {
      newOrderStatus = 'pending_payment';
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(paymentStatus.transaction_status)) {
      newOrderStatus = 'payment_failed';
    }

    // Update order status if changed
    if (newOrderStatus !== order.status) {
      await supabaseService
        .from('orders')
        .update({ status: newOrderStatus })
        .eq('id', order.id);
      
      order.status = newOrderStatus;
    }

    // Create or update payment record
    const { error: paymentError } = await supabaseService
      .from('payments')
      .upsert({
        order_id: order.id,
        amount: parseFloat(paymentStatus.gross_amount || '0'),
        status: paymentStatus.transaction_status,
        payment_proof: JSON.stringify(paymentStatus),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      });

    if (paymentError) {
      console.error('Error updating payment record:', paymentError);
    }

    return new Response(JSON.stringify({
      order,
      payment_status: paymentStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});