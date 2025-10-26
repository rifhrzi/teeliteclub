<<<<<<< HEAD
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Home } from "lucide-react";
import { logger } from "@/lib/logger";
=======
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { logger } from "@/lib/logger";
import { MaintenanceCountdown } from "@/components/MaintenanceCountdown";
import { MaintenanceWaitlistForm } from "@/components/MaintenanceWaitlistForm";
>>>>>>> c78eca0 (Update Maintenance)

interface MaintenanceSettings {
  is_enabled: boolean;
  maintenance_start: string | null;
  maintenance_end: string | null;
  title: string;
  message: string;
  countdown_message: string;
}

<<<<<<< HEAD
interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const MaintenanceNotice = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    
    // Set up real-time subscription to maintenance settings
    const subscription = supabase
      .channel('maintenance_notice_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_settings'
        },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!settings?.maintenance_end) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(settings.maintenance_end!).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.maintenance_end]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .single();

      if (error) {
        logger.error('Failed to load maintenance settings', error);
        setSettings(null);
        return;
      }

      setSettings(data);
    } catch (error) {
      logger.error('Failed to load maintenance settings', error);
      setSettings(null);
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

  const isCountdownActive = () => {
    if (!settings?.maintenance_end) return false;
    const now = new Date().getTime();
    const endTime = new Date(settings.maintenance_end).getTime();
    return endTime > now;
  };

  if (loading || !settings || !isMaintenanceActive()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-100 p-4 rounded-full">
                <Clock className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800">
              {settings.title}
            </h1>
            
            <p className="text-gray-600 text-lg leading-relaxed">
=======
export const MaintenanceNotice = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("maintenance_settings")
          .select("*")
          .single();

        if (error) {
          logger.error("Failed to load maintenance settings", error);
          setSettings(null);
          return;
        }

        setSettings(data);
      } catch (error) {
        logger.error("Failed to load maintenance settings", error);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading || !settings) {
    return null;
  }

  const countdownActive = () => {
    if (!settings.maintenance_end) return false;
    return new Date(settings.maintenance_end).getTime() > Date.now();
  };

  return (
    <div className="min-h-[100svh] min-h-[100dvh] flex flex-col bg-gradient-to-br from-[#0f172a] via-[#1d2a5c] to-[#0f172a] text-white">
      <main className="flex-1 flex flex-col items-center px-4 pt-24 pb-8 sm:px-6 sm:pt-16 sm:pb-12 text-center">
        <div className="flex flex-col flex-1 w-full max-w-3xl text-center">
          <div className="flex flex-col items-center justify-center flex-1 gap-5 sm:gap-6">
            <h1 className="text-[clamp(34px,4.5vw,48px)] leading-[1.2] sm:leading-[1.15] tracking-[-0.02em] font-bold">
              {settings.title}
            </h1>

            <MaintenanceWaitlistForm formClassName="max-w-md" />

            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
>>>>>>> c78eca0 (Update Maintenance)
              {settings.message}
            </p>
          </div>

<<<<<<< HEAD
          {settings.maintenance_end && isCountdownActive() && (
            <div className="space-y-4">
              <p className="text-blue-600 font-medium">
                {settings.countdown_message}
              </p>
              
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="bg-blue-600 text-white rounded-lg p-3">
                    <div className="text-2xl font-bold">{countdown.days}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Hari</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-600 text-white rounded-lg p-3">
                    <div className="text-2xl font-bold">{countdown.hours}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Jam</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-600 text-white rounded-lg p-3">
                    <div className="text-2xl font-bold">{countdown.minutes}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Menit</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-600 text-white rounded-lg p-3">
                    <div className="text-2xl font-bold">{countdown.seconds}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Detik</div>
                </div>
              </div>
            </div>
          )}

          {settings.maintenance_end && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Estimasi tersedia: {new Date(settings.maintenance_end).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            Teelitee Club - Shop sementara tidak tersedia
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
=======
          {settings.maintenance_end && (
            <div className="mt-auto flex flex-col items-center gap-3 pb-6 sm:pb-8">
              {countdownActive() && (
                <>
                  {settings.countdown_message && (
                    <p className="text-sm sm:text-base font-medium text-white">
                      {settings.countdown_message}
                    </p>
                  )}
                  <MaintenanceCountdown target={settings.maintenance_end} tone="dark" />
                </>
              )}

              <p className="text-xs text-white/70">
                {`Estimasi selesai: ${new Date(settings.maintenance_end).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-white/70">
        <Button asChild variant="outline" className="gap-2 border-white/40 text-white hover:bg-white/10">
          <Link to="/">
            Kembali ke Beranda
          </Link>
        </Button>
        <div className="mt-4">© {new Date().getFullYear()} TeeLiteClub. All rights reserved.</div>
      </footer>
    </div>
  );
};
>>>>>>> c78eca0 (Update Maintenance)
