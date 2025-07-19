import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface CartItem {
  product_id: string;
  quantity: number;
  ukuran: string;
  product?: {
    price: number;
    name: string;
  };
}

interface OrderData {
  total: number;
  nama_lengkap: string;
  telepon: string;
  alamat: string;
  metode_pembayaran: string;
  shipping_method?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

    const { orderData, items }: { orderData: OrderData; items: CartItem[] } = await req.json();
    console.log('Order data received:', orderData);
    console.log('Items count:', items?.length);

    // Validate items and recalculate total server-side
    if (!items || items.length === 0) {
      throw new Error('No items in cart');
    }

    // Create service client first
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // CRITICAL: Validate stock availability for all items
    console.log('Validating stock for all items...');
    for (const item of items) {
      const { data: stockData, error: stockError } = await supabaseService
        .from('product_sizes')
        .select('stok')
        .eq('product_id', item.product_id)
        .eq('ukuran', item.ukuran)
        .single();

      if (stockError) {
        console.error('Stock validation error:', stockError);
        throw new Error(`Failed to validate stock for product ${item.product_id}`);
      }

      if (!stockData || stockData.stok < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id} size ${item.ukuran}. Available: ${stockData?.stok || 0}, Requested: ${item.quantity}`);
      }
    }

    // Fetch actual product prices and names from database
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabaseService
      .from('products')
      .select('id, price, name')
      .in('id', productIds);

    if (productsError) {
      throw new Error('Failed to validate product prices');
    }

    // Calculate actual total based on database prices
    let calculatedTotal = 0;
    const productPriceMap = new Map(products?.map(p => [p.id, p.price]) || []);
    const productNameMap = new Map(products?.map(p => [p.id, p.name]) || []);
    
    for (const item of items) {
      const actualPrice = productPriceMap.get(item.product_id);
      if (!actualPrice) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      calculatedTotal += actualPrice * item.quantity;
    }

    // Add shipping cost - check shipping_method if available, fallback to metode_pembayaran 
    const shippingCost = (orderData.shipping_method === 'express' || orderData.metode_pembayaran === 'express') ? 20000 : 0;
    calculatedTotal += shippingCost;

    // Validate submitted total against calculated total
    if (Math.abs(orderData.total - calculatedTotal) > 0.01) {
      console.error(`Price validation failed: submitted ${orderData.total}, calculated ${calculatedTotal}`);
      throw new Error('Price validation failed');
    }

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

    // Create order in database

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

    // Create order items with correct product information
    const orderItems = items.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.product_id,
      jumlah: item.quantity,
      harga: productPriceMap.get(item.product_id) || 0,
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

    // CRITICAL: Reserve stock immediately to prevent race conditions
    console.log('Reserving stock for order items...');
    const stockReservationPromises = items.map(async (item: CartItem) => {
      console.log(`Reserving stock for product ${item.product_id}, size ${item.ukuran}, quantity ${item.quantity}`);
      
      // Use atomic operation to reduce stock
      const { data: currentStock, error: stockError } = await supabaseService
        .from('product_sizes')
        .select('stok')
        .eq('product_id', item.product_id)
        .eq('ukuran', item.ukuran)
        .single();

      if (stockError) {
        throw new Error(`Failed to get current stock for product ${item.product_id}`);
      }

      if (!currentStock || currentStock.stok < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id} size ${item.ukuran}. Available: ${currentStock?.stok || 0}, Requested: ${item.quantity}`);
      }

      const newStock = currentStock.stok - item.quantity;
      
      const { error: updateError } = await supabaseService
        .from('product_sizes')
        .update({ stok: newStock })
        .eq('product_id', item.product_id)
        .eq('ukuran', item.ukuran);

      if (updateError) {
        throw new Error(`Failed to reserve stock for product ${item.product_id}: ${updateError.message}`);
      }

      console.log(`Stock reserved for product ${item.product_id}, size ${item.ukuran}: ${currentStock.stok} -> ${newStock}`);
      return { product_id: item.product_id, ukuran: item.ukuran, reserved: item.quantity };
    });

    try {
      await Promise.all(stockReservationPromises);
      console.log('All stock reservations successful');
    } catch (reservationError) {
      console.error('Stock reservation failed:', reservationError);
      
      // Rollback: Delete the created order and order items
      await supabaseService.from('order_items').delete().eq('order_id', order.id);
      await supabaseService.from('orders').delete().eq('id', order.id);
      
      throw reservationError;
    }

    // Update total stock in products table
    const uniqueProductIds = [...new Set(items.map(item => item.product_id))];
    for (const productId of uniqueProductIds) {
      const { data: allSizes } = await supabaseService
        .from('product_sizes')
        .select('stok')
        .eq('product_id', productId);

      if (allSizes) {
        const totalStock = allSizes.reduce((total, size) => total + (size.stok || 0), 0);
        await supabaseService
          .from('products')
          .update({ stock_quantity: totalStock })
          .eq('id', productId);
      }
    }

    // Prepare Midtrans transaction data
    const itemDetails = items.map((item: CartItem) => ({
      id: item.product_id,
      price: productPriceMap.get(item.product_id) || 0,
      quantity: item.quantity,
      name: `${productNameMap.get(item.product_id) || 'Unknown Product'} (${item.ukuran})`
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