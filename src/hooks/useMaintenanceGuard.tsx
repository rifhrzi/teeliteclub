import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface MaintenanceSettings {
  is_enabled: boolean;
  maintenance_start: string | null;
  maintenance_end: string | null;
}

// Routes that should be blocked during maintenance
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

// Routes that are always allowed (even during maintenance)
const ALLOWED_ROUTES = [
  '/',
  '/auth',
  '/admin',
  '/test-connection',
  '/debug-products',
  '/simple-test'
];

export const useMaintenanceGuard = (settings: MaintenanceSettings | null) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

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

  // Guard against route access during maintenance
  useEffect(() => {
    if (!settings) return;

    const maintenanceActive = isMaintenanceActive();
    const bypassMaintenance = shouldBypassMaintenance();
    const routeBlocked = isRouteBlocked(location.pathname);

    // Redirect to homepage if trying to access blocked route during maintenance
    if (maintenanceActive && !bypassMaintenance && routeBlocked) {
      console.log('🚫 Maintenance Guard: Blocking access to', location.pathname);
      navigate('/', { replace: true });
    }
  }, [location.pathname, settings, navigate, profile]);

  // Prevent browser back/forward navigation to blocked routes
  useEffect(() => {
    if (!settings) return;

    const handlePopState = (event: PopStateEvent) => {
      const maintenanceActive = isMaintenanceActive();
      const bypassMaintenance = shouldBypassMaintenance();
      const routeBlocked = isRouteBlocked(window.location.pathname);

      if (maintenanceActive && !bypassMaintenance && routeBlocked) {
        console.log('🚫 Maintenance Guard: Preventing navigation to', window.location.pathname);
        event.preventDefault();
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [settings, navigate, profile]);

  return {
    isMaintenanceActive: isMaintenanceActive(),
    shouldBypassMaintenance: shouldBypassMaintenance(),
    isRouteBlocked: isRouteBlocked(location.pathname)
  };
};
