import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Navigation,
  Home,
  Shield
} from "lucide-react";

export const RouteTestPanel = () => {
  const location = useLocation();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testRoutes = [
    { path: '/', name: 'Home', expected: 'Allowed' },
    { path: '/auth', name: 'Auth', expected: 'Allowed' },
    { path: '/admin', name: 'Admin', expected: 'Allowed' },
    { path: '/test-connection', name: 'Test Connection', expected: 'Allowed' },
    { path: '/debug-products', name: 'Debug Products', expected: 'Allowed' },
    { path: '/simple-test', name: 'Simple Test', expected: 'Allowed' },
    { path: '/maintenance-test', name: 'Maintenance Test', expected: 'Allowed' },
    { path: '/shop', name: 'Shop', expected: 'Blocked during maintenance' },
    { path: '/cart', name: 'Cart', expected: 'Blocked during maintenance' },
    { path: '/checkout', name: 'Checkout', expected: 'Blocked during maintenance' },
    { path: '/orders', name: 'Orders', expected: 'Blocked during maintenance' },
    { path: '/account', name: 'Account', expected: 'Blocked during maintenance' },
  ];

  const testRouteAccess = (route: { path: string; name: string; expected: string }) => {
    addTestResult(`🧪 Testing route: ${route.path} (${route.name})`);
    
    try {
      // Try to navigate to the route
      window.history.pushState({}, '', route.path);
      
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath === route.path) {
          addTestResult(`✅ Route accessible: ${route.path}`);
        } else {
          addTestResult(`🔄 Route redirected: ${route.path} → ${currentPath}`);
        }
      }, 100);
    } catch (error) {
      addTestResult(`❌ Route error: ${route.path} - ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Route Access Test Panel
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test route accessibility and maintenance mode protection
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Current route: <code className="bg-blue-100 px-1 py-0.5 rounded">{location.pathname}</code>
            </span>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearResults} variant="secondary" size="sm">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Route Test Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testRoutes.map((route) => (
              <div key={route.path} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => testRouteAccess(route)}
                  >
                    <Link to={route.path}>
                      {route.name}
                    </Link>
                  </Button>
                  <Badge 
                    variant={route.expected === 'Allowed' ? 'default' : 'secondary'}
                    className="ml-2 text-xs"
                  >
                    {route.expected === 'Allowed' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {route.expected === 'Allowed' ? 'OK' : 'BLOCKED'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {route.path}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Expected behavior during maintenance:</strong>
            </p>
            <ul className="text-xs text-gray-500 mt-1 space-y-1">
              <li>• <strong>Allowed routes:</strong> Should be accessible normally</li>
              <li>• <strong>Blocked routes:</strong> Should redirect to homepage during maintenance</li>
              <li>• <strong>Admin users:</strong> Can bypass maintenance mode</li>
              <li>• <strong>Test parameter:</strong> Add <code>?test_maintenance=true</code> to force maintenance view</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Click route links to test accessibility.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`${
                      result.includes('❌') ? 'text-red-600' : 
                      result.includes('✅') ? 'text-green-600' : 
                      result.includes('🔄') ? 'text-orange-600' :
                      result.includes('🧪') ? 'text-blue-600' :
                      'text-gray-700'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/maintenance-test">Maintenance Test</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Auth</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
