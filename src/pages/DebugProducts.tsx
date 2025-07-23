import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DebugProducts = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProductsQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Testing products query...');
      
      // Test the exact query from Shop.tsx
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, price, image_url, category, description, is_active, created_at,
          product_sizes (
            ukuran, stok
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Products query failed:', error);
        setError(JSON.stringify(error, null, 2));
        return;
      }

      console.log('✅ Products query successful:', data?.length, 'products found');
      setResults(data);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Testing simple products query...');
      
      // Test simple query without relationships
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, is_active")
        .eq("is_active", true)
        .limit(3);

      if (error) {
        console.error('❌ Simple query failed:', error);
        setError(JSON.stringify(error, null, 2));
        return;
      }

      console.log('✅ Simple query successful:', data?.length, 'products found');
      setResults(data);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Testing basic connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) {
        console.error('❌ Connection failed:', error);
        setError(JSON.stringify(error, null, 2));
        return;
      }

      console.log('✅ Connection successful');
      setResults({ connection: 'success', timestamp: new Date().toISOString() });

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testEnvironment = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Testing environment and configuration...');

      const envInfo = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        anonKeyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        environment: import.meta.env.VITE_APP_ENV,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD
      };

      console.log('Environment info:', envInfo);
      setResults(envInfo);

    } catch (err: any) {
      console.error('❌ Environment test error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run the environment test first
    testEnvironment();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Products Query</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testProductsQuery}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Products Query (Shop.tsx)'}
        </button>
        
        <button
          onClick={testSimpleQuery}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Simple Query'}
        </button>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Basic Connection'}
        </button>

        <button
          onClick={testEnvironment}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Environment'}
        </button>
      </div>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p>🔄 Testing query...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">❌ Error:</h3>
          <pre className="whitespace-pre-wrap text-sm mt-2">{error}</pre>
        </div>
      )}

      {results && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">✅ Results:</h3>
          <pre className="whitespace-pre-wrap text-sm mt-2 max-h-96 overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Environment Info:</h3>
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
        <p><strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
        <p><strong>Environment:</strong> {import.meta.env.VITE_APP_ENV}</p>
      </div>
    </div>
  );
};

export default DebugProducts;
