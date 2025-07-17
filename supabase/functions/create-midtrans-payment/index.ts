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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { orderData, items } = await req.json();

    // Midtrans configuration
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const isProduction = Deno.env.get('MIDTRANS_ENVIRONMENT') === 'production';
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Create order in database first
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generate order number
    const { data: orderNumberData } = await supabaseService.rpc('generate_order_number');
    
    const dbOrderData = {
      ...orderData,
      user_id: user.id,
      order_number: orderNumberData,
      status: 'pending'
    };

    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert([dbOrderData])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      jumlah: item.quantity,
      harga: item.product?.price || 0,
      ukuran: item.ukuran
    }));

    const { error: itemsError } = await supabaseService
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Prepare Midtrans transaction data
    const itemDetails = items.map((item: any) => ({
      id: item.product_id,
      price: item.product?.price || 0,
      quantity: item.quantity,
      name: `${item.product?.name} (${item.ukuran})`
    }));

    // Add shipping cost if express
    if (orderData.shipping_method === 'express') {
      itemDetails.push({
        id: 'shipping',
        price: 20000,
        quantity: 1,
        name: 'Ongkos Kirim Express'
      });
    }

    const transactionData = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: orderData.total + (orderData.shipping_method === 'express' ? 20000 : 0)
      },
      item_details: itemDetails,
      customer_details: {
        first_name: orderData.nama_pembeli,
        email: orderData.email_pembeli,
        phone: orderData.telepon_pembeli,
        shipping_address: {
          address: orderData.shipping_address,
        }
      },
      credit_card: {
        secure: true
      },
      callbacks: {
        finish: `${req.headers.get('origin')}/payment-success?order_id=${order.order_number}`
      }
    };

    // Create Midtrans transaction
    const midtransResponse = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`
      },
      body: JSON.stringify(transactionData)
    });

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error('Midtrans error:', errorText);
      throw new Error('Failed to create Midtrans transaction');
    }

    const midtransData = await midtransResponse.json();

    // Update order with Midtrans token
    await supabaseService
      .from('orders')
      .update({ 
        tracking_number: midtransData.token // Store Midtrans token in tracking_number field temporarily
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      order_id: order.order_number
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating Midtrans payment:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});