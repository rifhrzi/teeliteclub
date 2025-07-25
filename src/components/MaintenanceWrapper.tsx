import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { MaintenanceNotice } from "@/components/MaintenanceNotice";
import { useAuth } from "@/hooks/useAuth";

interface MaintenanceSettings {
  is_enabled: boolean;
  maintenance_start: string | null;
  maintenance_end: string | null;
}

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export const MaintenanceWrapper = ({ children }: MaintenanceWrapperProps) => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    loadMaintenanceSettings();
    
    // Set up real-time subscription to maintenance settings
    const subscription = supabase
      .channel('maintenance_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_settings'
        },
        () => {
          loadMaintenanceSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('is_enabled, maintenance_start, maintenance_end')
        .single();

      if (error) {
        logger.error('Failed to load maintenance settings', error);
        // If error, assume maintenance is off to prevent blocking access
        setSettings({ is_enabled: false, maintenance_start: null, maintenance_end: null });
        return;
      }

      setSettings(data);
    } catch (error) {
      logger.error('Failed to load maintenance settings', error);
      // If error, assume maintenance is off to prevent blocking access
      setSettings({ is_enabled: false, maintenance_start: null, maintenance_end: null });
    } finally {
      setLoading(false);
    }
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

  // Show loading state while checking maintenance settings
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show maintenance notice for shop and product pages during maintenance
  // But allow homepage to show normally with countdown
  const currentPath = window.location.pathname;
  const shouldShowMaintenanceNotice = isMaintenanceActive() && 
    !shouldBypassMaintenance() && 
    (currentPath.startsWith('/shop') || currentPath.startsWith('/product/'));
  
  if (shouldShowMaintenanceNotice) {
    return <MaintenanceNotice />;
  }

  // Show normal app content (homepage will show countdown via MaintenanceCountdown component)
  return <>{children}</>;
};