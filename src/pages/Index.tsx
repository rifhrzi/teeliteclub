import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MaintenanceCountdown } from "@/components/MaintenanceCountdown";
import { MobileSafeWrapper } from "@/components/MobileSafeWrapper";
const Index = () => {
  const [heroImage, setHeroImage] = useState("/lovable-uploads/a773ac2f-9e06-49da-a3b9-b4425905b493.png");
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  
  useEffect(() => {
    loadHeroImage();
  }, []);
  const loadHeroImage = async () => {
    try {
      const {
        data
      } = await supabase.from('system_settings').select('value').eq('key', 'hero_image_url').single();
      if (data?.value) {
        setHeroImage(data.value);
      }
    } catch (error) {
      console.error('Failed to load hero image:', error);
      // Keep default image if loading fails
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-black/40 rounded-none" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-full">
          <div className="text-center text-dark-blue py-[200px]">
            <MobileSafeWrapper 
              fallback={
                <Button variant="outline" size="lg" className="px-12 py-6 text-lg font-medium border-white text-white bg-transparent hover:bg-white hover:text-dark-blue animate-scale-in" asChild>
                  <Link to="/shop">Shop Now</Link>
                </Button>
              }
            >
              <MaintenanceCountdown onMaintenanceCheck={setIsMaintenanceActive} />
            </MobileSafeWrapper>
            
            {/* Always show button as fallback if maintenance component fails */}
            {!isMaintenanceActive && (
              <Button variant="outline" size="lg" className="px-12 py-6 text-lg font-medium border-white text-white bg-transparent hover:bg-white hover:text-dark-blue animate-scale-in" asChild>
                <Link to="/shop">Shop Now</Link>
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Index;