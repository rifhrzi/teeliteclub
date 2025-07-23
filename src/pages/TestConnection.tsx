import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testDatabaseConnection, testAuthentication } from '@/utils/testConnection';

const TestConnection = () => {
  const [connectionResult, setConnectionResult] = useState(null);
  const [authResult, setAuthResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setConnectionResult(result);
      console.log('Connection test result:', result);
    } catch (error) {
      setConnectionResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runAuthTest = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const result = await testAuthentication(email, password);
      setAuthResult(result);
      console.log('Auth test result:', result);
    } catch (error) {
      setAuthResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run connection test on page load
    runConnectionTest();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Database Connection Test</h1>
      
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runConnectionTest} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {connectionResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Connection Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(connectionResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authentication Test */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <Button onClick={runAuthTest} disabled={loading || !email || !password}>
            {loading ? 'Testing...' : 'Test Authentication'}
          </Button>
          
          {authResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Authentication Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(authResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</div>
            <div><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}</div>
            <div><strong>App URL:</strong> {import.meta.env.VITE_APP_URL}</div>
            <div><strong>Environment:</strong> {import.meta.env.VITE_APP_ENV}</div>
            <div><strong>Current URL:</strong> {window.location.href}</div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Connection Test:</strong> Tests if the app can connect to Supabase database</p>
            <p>2. <strong>Authentication Test:</strong> Tests login with your credentials</p>
            <p>3. Check the browser console (F12) for detailed logs</p>
            <p>4. If connection fails, check your internet connection and Supabase status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestConnection;
