import { Link } from "react-router-dom";
const heroImage = "/lovable-uploads/221962fb-649c-4648-9185-60908c468b2f.png";
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
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-foreground">
              Teelite
            </Link>

            {/* Right side - Shop, Cart, User */}
            <div className="flex items-center space-x-6">
              <Link to="/shop" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                Shop
              </Link>

              {/* Cart */}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/cart">
                  <ShoppingCart className="h-6 w-6" />
                  {getCartItemsCount() > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getCartItemsCount()}
                    </Badge>}
                </Link>
              </Button>

              {/* User Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user ? <>
                      <DropdownMenuItem disabled>
                        <div className="flex flex-col">
                          <span className="font-medium">{profile?.nama || 'User'}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account">My Account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive">
                        Logout
                      </DropdownMenuItem>
                    </> : <DropdownMenuItem asChild>
                      <Link to="/auth">Login / Register</Link>
                    </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-full">
          <div className="text-center py-32 text-white">
            
            
            <Button variant="outline" size="lg" className="px-12 py-6 text-lg font-medium text-white border-white hover:bg-white hover:text-black animate-scale-in" asChild>
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Index;