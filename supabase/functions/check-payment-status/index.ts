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
    const { order_id } = await req.json();

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

    // Get order from database
    const { data: order } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_number', order_id)
      .eq('user_id', user.id)
      .single();

    return new Response(JSON.stringify({
      order,
      midtrans_status: paymentStatus
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