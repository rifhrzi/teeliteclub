import { Link } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { getCartItemsCount } = useCart();

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                  {getCartItemsCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getCartItemsCount()}
                    </Badge>
                  )}
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
                  {user ? (
                    <>
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
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/auth">Login / Register</Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 bg-muted flex items-center justify-center">
        <div className="text-center py-32">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg font-medium"
            asChild
          >
            <Link to="/shop">Shop Now</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-foreground mb-8">Footer</h3>
            <div className="grid md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
              <div>
                <h4 className="font-semibold mb-4 text-foreground">About Teelite</h4>
                <p className="text-muted-foreground">
                  Premium quality fashion with affordable prices for everyone.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Contact</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p>Email: info@teelite.com</p>
                  <p>Phone: +62 812-3456-7890</p>
                  <p>WhatsApp: +62 812-3456-7890</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Services</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p>Size Guide</p>
                  <p>Return Policy</p>
                  <p>Shipping & Payment</p>
                </div>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
              <p>&copy; 2024 Teelite. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
