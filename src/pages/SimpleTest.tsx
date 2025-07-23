import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SimpleTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBasicQuery = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      console.log('🔍 Testing basic Supabase query...');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

      // Test 1: Most basic query possible
      const { data, error, count } = await supabase
        .from('products')
        .select('id, name', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('❌ Basic query failed:', error);
        setResult(`❌ Error: ${error.message}\n\nDetails: ${JSON.stringify(error, null, 2)}`);
        return;
      }

      console.log('✅ Basic query successful:', data);
      setResult(`✅ Success!\n\nCount: ${count}\nData: ${JSON.stringify(data, null, 2)}`);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setResult(`❌ Unexpected error: ${err.message}\n\nStack: ${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testProductsQuery = async () => {
    setLoading(true);
    setResult('Testing products query...');

    try {
      console.log('🔍 Testing products query...');

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, is_active')
        .eq('is_active', true)
        .limit(3);

      if (error) {
        console.error('❌ Products query failed:', error);
        setResult(`❌ Products Error: ${error.message}\n\nDetails: ${JSON.stringify(error, null, 2)}`);
        return;
      }

      console.log('✅ Products query successful:', data);
      setResult(`✅ Products Success!\n\nFound: ${data?.length} products\nData: ${JSON.stringify(data, null, 2)}`);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setResult(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRelationshipQuery = async () => {
    setLoading(true);
    setResult('Testing relationship query...');

    try {
      console.log('🔍 Testing relationship query...');

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price,
          product_sizes (
            ukuran, stok
          )
        `)
        .eq('is_active', true)
        .limit(2);

      if (error) {
        console.error('❌ Relationship query failed:', error);
        setResult(`❌ Relationship Error: ${error.message}\n\nDetails: ${JSON.stringify(error, null, 2)}`);
        return;
      }

      console.log('✅ Relationship query successful:', data);
      setResult(`✅ Relationship Success!\n\nFound: ${data?.length} products\nData: ${JSON.stringify(data, null, 2)}`);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setResult(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Simple Supabase Test</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testBasicQuery}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic Query'}
        </button>
        
        <button
          onClick={testProductsQuery}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Products Query'}
        </button>
        
        <button
          onClick={testRelationshipQuery}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Relationship Query'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Environment:</h3>
        <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
        <p><strong>Has Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
        <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
      </div>

      {result && (
        <div className="mt-6 bg-white border rounded p-4">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default SimpleTest;
