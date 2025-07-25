import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Navigation,
  ExternalLink
} from "lucide-react";

export const MaintenanceTestPanel = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingBypass, setIsTestingBypass] = useState(false);
  const navigate = useNavigate();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFastNavigation = () => {
    setIsTestingBypass(true);
    addTestResult("🚀 Testing fast navigation bypass...");
    
    // Simulate rapid navigation attempts
    const routes = ['/shop', '/cart', '/checkout', '/orders', '/account'];
    let attemptCount = 0;
    
    const rapidNavigate = () => {
      if (attemptCount < routes.length) {
        const route = routes[attemptCount];
        addTestResult(`⚡ Attempting rapid navigation to: ${route}`);
        
        try {
          navigate(route);
          setTimeout(() => {
            if (window.location.pathname === route) {
              addTestResult(`❌ BYPASS SUCCESSFUL: Accessed ${route}`);
            } else {
              addTestResult(`✅ BLOCKED: Redirected from ${route} to ${window.location.pathname}`);
            }
            attemptCount++;
            if (attemptCount < routes.length) {
              setTimeout(rapidNavigate, 100); // Very fast attempts
            } else {
              setIsTestingBypass(false);
              addTestResult("🏁 Fast navigation test completed");
            }
          }, 50);
        } catch (error) {
          addTestResult(`✅ BLOCKED: Navigation to ${route} failed - ${error}`);
          attemptCount++;
          if (attemptCount < routes.length) {
            setTimeout(rapidNavigate, 100);
          } else {
            setIsTestingBypass(false);
            addTestResult("🏁 Fast navigation test completed");
          }
        }
      }
    };
    
    rapidNavigate();
  };

  const testURLManipulation = () => {
    addTestResult("🔗 Testing URL manipulation...");
    
    const testRoutes = [
      '/shop',
      '/product/test-product',
      '/cart',
      '/checkout',
      '/orders',
      '/account'
    ];
    
    testRoutes.forEach((route, index) => {
      setTimeout(() => {
        addTestResult(`🎯 Testing direct URL access: ${route}`);
        
        // Attempt to change URL directly
        try {
          window.history.pushState({}, '', route);
          
          // Check if we're still on the route after a brief delay
          setTimeout(() => {
            if (window.location.pathname === route) {
              addTestResult(`❌ BYPASS SUCCESSFUL: Direct access to ${route} allowed`);
            } else {
              addTestResult(`✅ BLOCKED: Direct access to ${route} redirected to ${window.location.pathname}`);
            }
            
            if (index === testRoutes.length - 1) {
              addTestResult("🏁 URL manipulation test completed");
            }
          }, 200);
        } catch (error) {
          addTestResult(`✅ BLOCKED: URL manipulation to ${route} failed - ${error}`);
        }
      }, index * 300);
    });
  };

  const testBrowserNavigation = () => {
    addTestResult("⬅️ Testing browser back/forward navigation...");
    
    // Push some history states
    window.history.pushState({}, '', '/shop');
    window.history.pushState({}, '', '/cart');
    window.history.pushState({}, '', '/checkout');
    
    addTestResult("📚 Created history stack with blocked routes");
    
    // Try to go back
    setTimeout(() => {
      addTestResult("⬅️ Attempting browser back navigation...");
      window.history.back();
      
      setTimeout(() => {
        addTestResult(`📍 After back navigation: ${window.location.pathname}`);
        
        // Try to go forward
        setTimeout(() => {
          addTestResult("➡️ Attempting browser forward navigation...");
          window.history.forward();
          
          setTimeout(() => {
            addTestResult(`📍 After forward navigation: ${window.location.pathname}`);
            addTestResult("🏁 Browser navigation test completed");
          }, 200);
        }, 500);
      }, 200);
    }, 500);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    addTestResult("🔧 Maintenance Test Panel initialized");
    addTestResult("⚠️ These tests verify maintenance mode bypass protection");
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Maintenance Mode Security Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testFastNavigation}
              disabled={isTestingBypass}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Test Fast Navigation
            </Button>
            
            <Button 
              onClick={testURLManipulation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Test URL Manipulation
            </Button>
            
            <Button 
              onClick={testBrowserNavigation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Test Browser Navigation
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={clearResults} variant="secondary" size="sm">
              Clear Results
            </Button>
            <Badge variant={isTestingBypass ? "destructive" : "secondary"}>
              {isTestingBypass ? "Testing in Progress..." : "Ready"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Run a test to see results.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`${
                      result.includes('❌') ? 'text-red-600' : 
                      result.includes('✅') ? 'text-green-600' : 
                      result.includes('🚀') || result.includes('⚡') ? 'text-blue-600' :
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
            <CheckCircle className="w-5 h-5" />
            Manual Test Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/shop">Shop</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/cart">Cart</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/checkout">Checkout</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">Orders</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/account">Account</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/product/test">Product</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Auth (Allowed)</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Home (Allowed)</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Click these links to manually test maintenance mode protection. 
            Blocked routes should redirect to the homepage during maintenance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
