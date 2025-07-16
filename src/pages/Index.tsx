import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Footer } from "@/components/layout/Footer";
const Index = () => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    getCartItemsCount
  } = useCart();
  const [heroImage, setHeroImage] = useState("/lovable-uploads/a773ac2f-9e06-49da-a3b9-b4425905b493.png");
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
      {/* Header */}
      <header className="bg-[hsl(var(--header-footer))]">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-center">
            {/* Logo - Centered */}
            <Link to="/" className="flex flex-col items-center text-2xl font-etna font-black text-[hsl(var(--header-footer-foreground))] tracking-wider leading-tight">
              <span>TEELITE</span>
              <span>CLUB</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-black/40 rounded-none" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-full">
          <div className="text-center text-dark-blue py-[200px]">
            
            
            <Button variant="outline" size="lg" className="px-12 py-6 text-lg font-medium border-white text-white bg-transparent hover:bg-white hover:text-dark-blue animate-scale-in" asChild>
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Index;