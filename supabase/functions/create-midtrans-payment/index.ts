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
    console.log('Starting Midtrans payment creation...');
    
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

    console.log('User authenticated:', user.email);

    const { orderData, items } = await req.json();
    console.log('Order data received:', orderData);
    console.log('Items count:', items?.length);

    // Midtrans configuration
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const environment = Deno.env.get('MIDTRANS_ENVIRONMENT') || 'sandbox';
    const isProduction = environment === 'production';
    
    console.log('Midtrans environment:', environment);
    console.log('Server key exists:', !!serverKey);
    console.log('Server key prefix:', serverKey ? serverKey.substring(0, 8) + '...' : 'none');
    
    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY environment variable is not configured. Please add your Midtrans server key in Supabase secrets.');
    }

    // Validate server key format based on environment
    if (isProduction && !serverKey.startsWith('SB-Mid-server-')) {
      throw new Error('Production environment requires a production server key starting with "SB-Mid-server-"');
    }
    
    if (!isProduction && !serverKey.startsWith('SB-Mid-server-')) {
      throw new Error('Sandbox environment requires a sandbox server key starting with "SB-Mid-server-"');
    }
    
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Create order in database first
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generate order number
    console.log('Generating order number...');
    const { data: orderNumberData } = await supabaseService.rpc('generate_order_number');
    console.log('Order number generated:', orderNumberData);
    
    const dbOrderData = {
      ...orderData,
      user_id: user.id,
      order_number: orderNumberData,
      status: 'pending'
    };

    console.log('Creating order in database...');
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert([dbOrderData])
      .select()
      .single();

    if (orderError) {
      console.error('Database order error:', orderError);
      throw orderError;
    }

    console.log('Order created with ID:', order.id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      jumlah: item.quantity,
      harga: item.product?.price || 0,
      ukuran: item.ukuran
    }));

    console.log('Creating order items...');
    const { error: itemsError } = await supabaseService
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Database items error:', itemsError);
      throw itemsError;
    }

    console.log('Order items created successfully');

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

    const grossAmount = orderData.total + (orderData.shipping_method === 'express' ? 20000 : 0);

    const transactionData = {
      transaction_details: {
        order_id: order.order_number,
        gross_amount: grossAmount
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
      }
    };

    console.log('Midtrans transaction data:', JSON.stringify(transactionData, null, 2));

    // Create Midtrans transaction
    console.log('Calling Midtrans API...');
    const midtransResponse = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`
      },
      body: JSON.stringify(transactionData)
    });

    console.log('Midtrans response status:', midtransResponse.status);

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error('Midtrans API error response:', errorText);
      throw new Error(`Midtrans API error: ${midtransResponse.status} - ${errorText}`);
    }

    const midtransData = await midtransResponse.json();
    console.log('Midtrans response data:', midtransData);

    // Update order with Midtrans token
    await supabaseService
      .from('orders')
      .update({ 
        tracking_number: midtransData.token // Store Midtrans token in tracking_number field temporarily
      })
      .eq('id', order.id);

    console.log('Payment creation successful');

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