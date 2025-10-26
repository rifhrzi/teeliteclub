<<<<<<< HEAD
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wrench, Clock, Home, RefreshCw, KeyRound } from "lucide-react";
import { logger } from "@/lib/logger";
=======
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MaintenanceCountdown } from "@/components/MaintenanceCountdown";
import { MaintenanceWaitlistForm } from "@/components/MaintenanceWaitlistForm";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Home, KeyRound, RefreshCw, Wrench } from "lucide-react";
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

const MaintenancePage = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [clickCount, setClickCount] = useState(0);
=======
const MaintenancePage = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);
>>>>>>> c78eca0 (Update Maintenance)

  useEffect(() => {
    loadSettings();
  }, []);

<<<<<<< HEAD
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

=======
>>>>>>> c78eca0 (Update Maintenance)
  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
<<<<<<< HEAD
        .from('maintenance_settings')
        .select('*')
        .single();

      if (error) {
        logger.error('Failed to load maintenance settings', error);
=======
        .from("maintenance_settings")
        .select("*")
        .single();

      if (error) {
        logger.error("Failed to load maintenance settings", error);
        setSettings(null);
>>>>>>> c78eca0 (Update Maintenance)
        return;
      }

      setSettings(data);
    } catch (error) {
<<<<<<< HEAD
      logger.error('Failed to load maintenance settings', error);
=======
      logger.error("Failed to load maintenance settings", error);
      setSettings(null);
>>>>>>> c78eca0 (Update Maintenance)
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const isCountdownActive = () => {
    if (!settings?.maintenance_end) return false;
    const now = new Date().getTime();
    const endTime = new Date(settings.maintenance_end).getTime();
    return endTime > now;
  };

  const handleIconClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    // Show admin button after 5 clicks within 3 seconds
    if (newClickCount >= 5) {
      setShowAdminButton(true);
    }
    
    // Reset click count after 3 seconds
    setTimeout(() => {
      setClickCount(0);
    }, 3000);
=======
  const handleIconClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setShowAdminButton(true);
    }
    setTimeout(() => setClickCount(0), 3000);
  };

  const countdownActive = () => {
    if (!settings?.maintenance_end) return false;
    return new Date(settings.maintenance_end).getTime() > Date.now();
>>>>>>> c78eca0 (Update Maintenance)
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat...</p>
          </CardContent>
        </Card>
=======
      <div className="min-h-[100svh] min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1d2a5c] to-[#0f172a] text-white px-6">
        <div className="flex flex-col items-center gap-4 text-white/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <p>Memuat…</p>
        </div>
>>>>>>> c78eca0 (Update Maintenance)
      </div>
    );
  }

  if (!settings) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800">Terjadi Kesalahan</h1>
            <p className="text-gray-600">Gagal memuat pengaturan maintenance.</p>
            <Button onClick={loadSettings} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
=======
      <div className="min-h-[100svh] min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1d2a5c] to-[#0f172a] px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white/10 border border-white/30 p-8 text-center space-y-4 text-white">
          <Wrench className="mx-auto h-12 w-12" />
          <h1 className="text-xl font-semibold">Terjadi Kesalahan</h1>
          <p className="text-sm text-white/80">
            Gagal memuat pengaturan maintenance. Silakan coba lagi beberapa saat.
          </p>
          <Button onClick={loadSettings} variant="outline" className="gap-2 border-white/40 text-white">
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
        </div>
>>>>>>> c78eca0 (Update Maintenance)
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div 
                className={`bg-blue-100 p-4 rounded-full cursor-pointer hover:bg-blue-200 transition-all duration-200 ${
                  clickCount > 0 ? 'ring-2 ring-blue-300 ring-opacity-50 animate-pulse' : ''
                }`}
                onClick={handleIconClick}
                title={clickCount > 0 ? `${5 - clickCount} klik lagi untuk akses admin` : ""}
              >
                <Wrench className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            
            {clickCount > 0 && !showAdminButton && (
              <div className="text-xs text-gray-500 animate-in fade-in-0">
                {5 - clickCount} klik lagi untuk akses admin
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-gray-800">
              {settings.title}
            </h1>
            
            <p className="text-gray-600 text-lg leading-relaxed">
=======
    <div className="min-h-[100svh] min-h-[100dvh] flex flex-col bg-gradient-to-br from-[#0f172a] via-[#1d2a5c] to-[#0f172a] text-white">
      <main className="flex-1 flex flex-col items-center px-4 pt-24 pb-8 sm:px-6 sm:pt-16 sm:pb-12 text-center">
        <div className="flex flex-col flex-1 w-full max-w-3xl text-center">
          <div className="flex flex-col items-center justify-center flex-1 gap-5 sm:gap-6">
            <button
              type="button"
              onClick={handleIconClick}
              className={`h-12 w-12 flex items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition ${
                clickCount > 0 ? "ring-2 ring-white/30 animate-pulse" : ""
              }`}
              title={clickCount > 0 ? `${5 - clickCount} klik lagi untuk akses admin` : "Akses admin"}
            >
              <Wrench className="h-6 w-6" />
            </button>

            {clickCount > 0 && !showAdminButton && (
              <p className="text-xs text-white/70">
                {5 - clickCount} klik lagi untuk akses admin
              </p>
            )}

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
                Estimasi selesai: {new Date(settings.maintenance_end).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </Link>
            </Button>
            
            {showAdminButton && (
              <div className="animate-in fade-in-0 zoom-in-95 duration-300">
                <Button 
                  variant="default" 
                  className="gap-2 bg-gray-800 hover:bg-gray-900 text-white"
                  onClick={() => {
                    console.log('Admin button clicked, navigating to auth page');
                    window.location.href = '/auth?mode=signin';
                  }}
                >
                  <KeyRound className="w-4 h-4" />
                  Login Admin
                </Button>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            Teelitee Club - Maintenance Mode
          </div>
        </CardContent>
      </Card>
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

          <div className="w-full pt-6 sm:pt-8 space-y-3 flex flex-col items-center">
            <Button asChild variant="outline" className="gap-2 border-white/40 text-white hover:bg-white/10">
              <Link to="/">
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>

            {showAdminButton && (
              <Button
                variant="default"
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40"
                onClick={() => {
                  window.location.href = "/auth?mode=signin";
                }}
              >
                <KeyRound className="h-4 w-4" />
                Login Admin
              </Button>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-white/70">
        © {new Date().getFullYear()} TeeLiteClub. All rights reserved.
      </footer>
>>>>>>> c78eca0 (Update Maintenance)
    </div>
  );
};

<<<<<<< HEAD
export default MaintenancePage;
=======
export default MaintenancePage;
>>>>>>> c78eca0 (Update Maintenance)
