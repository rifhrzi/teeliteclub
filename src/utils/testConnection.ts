// Database Connection Test Utility
// Use this to diagnose connection issues

import { supabase } from '@/integrations/supabase/client';

export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');

  try {
    // Test 1: Basic connection with products (the actual failing query)
    console.log('📡 Testing products query (the one that\'s failing)...');
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
        id, name, price, image_url, category, description, is_active, created_at,
        product_sizes (
          ukuran, stok
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      return { success: false, error: productsError.message, details: productsError };
    }

    console.log('✅ Products query successful:', productsData?.length, 'products found');

    // Test 2: Basic connection
    console.log('📡 Testing basic Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      console.error('❌ Basic connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Basic connection successful');
    
    // Test 2: Authentication state
    console.log('🔐 Testing authentication state...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
    } else {
      console.log('✅ Session check successful:', session.session ? 'Logged in' : 'Not logged in');
    }
    
    // Test 3: Test specific tables
    console.log('📊 Testing table access...');
    
    const tables = ['profiles', 'products', 'orders', 'system_settings'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ ${table} table access failed:`, error.message);
          results[table] = { success: false, error: error.message };
        } else {
          console.log(`✅ ${table} table accessible`);
          results[table] = { success: true, count: data?.length || 0 };
        }
      } catch (err) {
        console.error(`❌ ${table} table test error:`, err);
        results[table] = { success: false, error: err.message };
      }
    }
    
    // Test 4: Storage access
    console.log('🗄️ Testing storage access...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) {
        console.error('❌ Storage access failed:', storageError);
      } else {
        console.log('✅ Storage accessible, buckets:', buckets?.map(b => b.name));
      }
    } catch (err) {
      console.error('❌ Storage test error:', err);
    }
    
    // Test 5: Environment variables
    console.log('⚙️ Checking environment variables...');
    const envVars = {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
      MIDTRANS_CLIENT_KEY: import.meta.env.VITE_MIDTRANS_CLIENT_KEY ? '✅ Present' : '❌ Missing',
      APP_URL: import.meta.env.VITE_APP_URL,
    };
    
    console.log('Environment variables:', envVars);
    
    return {
      success: true,
      results: {
        connection: true,
        session: session.session ? 'authenticated' : 'anonymous',
        tables: results,
        environment: envVars,
        productsFound: productsData?.length || 0,
        sampleProducts: productsData?.slice(0, 2) || []
      }
    };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: error
    };
  }
};

// Quick connection test for debugging
export const quickConnectionTest = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Test authentication specifically
export const testAuthentication = async (email: string, password: string) => {
  console.log('🔐 Testing authentication with credentials...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Authentication failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Authentication successful:', data.user?.email);
    
    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      return { 
        success: true, 
        user: data.user, 
        profileError: profileError.message 
      };
    }
    
    console.log('✅ Profile loaded:', profile);
    
    return {
      success: true,
      user: data.user,
      profile: profile
    };
    
  } catch (error) {
    console.error('❌ Authentication test error:', error);
    return { success: false, error: error.message };
  }
};
