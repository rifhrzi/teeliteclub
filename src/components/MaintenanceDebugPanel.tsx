import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings, 
  Database, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";

interface MaintenanceSettings {
  id: string;
  is_enabled: boolean;
  maintenance_start: string | null;
  maintenance_end: string | null;
  title: string;
  message: string;
  countdown_message: string;
  created_at: string | null;
  updated_at: string | null;
}

export const MaintenanceDebugPanel = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const location = useLocation();

  const BLOCKED_ROUTES = [
    '/shop',
    '/product/',
    '/cart',
    '/checkout',
    '/orders',
    '/account',
    '/payment-success',
    '/finish-payment',
    '/payment-error'
  ];

  const ALLOWED_ROUTES = [
    '/',
    '/auth',
    '/admin',
    '/test-connection',
    '/debug-products',
    '/simple-test',
    '/maintenance-test',
    '/route-test'
  ];

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading maintenance settings...');
      
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      if (!data) {
        console.warn('⚠️ No maintenance settings found');
        setError('No maintenance settings found in database');
        return;
      }

      console.log('✅ Settings loaded:', data);
      setSettings(data);
    } catch (err) {
      console.error('❌ Exception:', err);
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const isRouteBlocked = (pathname: string): boolean => {
    // Check if route is explicitly allowed
    if (ALLOWED_ROUTES.includes(pathname)) {
      return false;
    }

    // Check if route starts with any blocked route pattern
    return BLOCKED_ROUTES.some(blockedRoute =>
      pathname.startsWith(blockedRoute) ||
      (blockedRoute.endsWith('/') && pathname.startsWith(blockedRoute.slice(0, -1)))
    );
  };

  const isMaintenanceActive = () => {
    if (!settings?.is_enabled) return false;

    const now = new Date();

    // If no start time is set, maintenance is active when enabled
    if (!settings.maintenance_start) return true;

    const startTime = new Date(settings.maintenance_start);

    // If no end time is set, maintenance is active after start time
    if (!settings.maintenance_end) return now >= startTime;

    const endTime = new Date(settings.maintenance_end);

    // Maintenance is active between start and end time
    return now >= startTime && now < endTime;
  };

  const shouldBypassMaintenance = () => {
    // Allow admin users to bypass maintenance mode
    // But allow testing by adding ?test_maintenance=true to URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test_maintenance') === 'true') {
      return false; // Force showing maintenance page for testing
    }

    return profile?.role === 'admin';
  };

  const toggleMaintenance = async () => {
    if (!settings) return;

    try {
      const newEnabled = !settings.is_enabled;
      
      const { error } = await supabase
        .from('maintenance_settings')
        .update({ is_enabled: newEnabled })
        .eq('id', settings.id);

      if (error) {
        console.error('Failed to toggle maintenance:', error);
        return;
      }

      setSettings({ ...settings, is_enabled: newEnabled });
      console.log(`✅ Maintenance ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Exception toggling maintenance:', err);
    }
  };

  const currentRouteBlocked = isRouteBlocked(location.pathname);
  const maintenanceActive = isMaintenanceActive();
  const bypassActive = shouldBypassMaintenance();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Maintenance Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadSettings} disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reload Settings
            </Button>
            {settings && (
              <Button onClick={toggleMaintenance} variant="outline" size="sm">
                {settings.is_enabled ? 'Disable' : 'Enable'} Maintenance
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading settings...
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {settings && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Enabled:</strong> 
                  <Badge variant={settings.is_enabled ? "destructive" : "secondary"} className="ml-2">
                    {settings.is_enabled ? 'YES' : 'NO'}
                  </Badge>
                </div>
                <div>
                  <strong>Start:</strong> {settings.maintenance_start || 'Not set'}
                </div>
                <div>
                  <strong>End:</strong> {settings.maintenance_end || 'Not set'}
                </div>
                <div>
                  <strong>Updated:</strong> {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
                </div>
              </div>
              <div>
                <strong>Title:</strong> {settings.title}
              </div>
              <div>
                <strong>Message:</strong> {settings.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <strong>Current Route:</strong>
                <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code>
              </div>
              <div className="flex items-center gap-2">
                <strong>Route Blocked:</strong>
                {currentRouteBlocked ? (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    YES
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    NO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>Maintenance Active:</strong>
                {maintenanceActive ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    YES
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    NO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>Admin Bypass:</strong>
                {bypassActive ? (
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    YES
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    NO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>User Role:</strong>
                <Badge variant="outline">{profile?.role || 'Not logged in'}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <strong>Should Show Maintenance:</strong>
                <div className="mt-1">
                  {maintenanceActive && !bypassActive && currentRouteBlocked ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      YES - Route should be blocked
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      NO - Route should be accessible
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
