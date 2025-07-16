import { useState } from "react";
import { Search, ShoppingCart, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
interface HeaderProps {
  onSearchChange?: (query: string) => void;
}
export function Header({
  onSearchChange
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    getCartItemsCount
  } = useCart();
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchQuery);
  };
  const navigationItems = [{
    label: "Semua Produk",
    href: "/"
  }, {
    label: "Pria",
    href: "/kategori/pria"
  }, {
    label: "Wanita",
    href: "/kategori/wanita"
  }, {
    label: "Anak",
    href: "/kategori/anak"
  }];
  return <header className="bg-[hsl(var(--header-footer))] text-[hsl(var(--header-footer-foreground))]">
      <div className="container mx-auto px-4 py-px">
        <div className="flex h-16 items-center justify-between my-[8px]">
          {/* Left side - Burger menu */}
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(var(--header-footer-foreground))] hover:bg-[hsl(var(--header-footer-foreground))]/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map(item => <Link key={item.href} to={item.href} className="block py-2 text-lg font-medium hover:text-muted-foreground transition-colors">
                      {item.label}
                    </Link>)}
                  
                  <div className="border-t pt-4 mt-8">
                    {user ? <>
                        <div className="mb-4">
                          <p className="font-medium">{profile?.nama || 'User'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Link to="/account" className="block py-2 text-lg font-medium hover:text-muted-foreground transition-colors">
                          Akun Saya
                        </Link>
                        <Link to="/orders" className="block py-2 text-lg font-medium hover:text-muted-foreground transition-colors">
                          Pesanan Saya
                        </Link>
                        <Button onClick={signOut} variant="ghost" className="w-full justify-start p-2 h-auto text-lg font-medium text-destructive hover:text-destructive/80">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </> : <div className="space-y-2">
                        <Link to="/auth" className="block py-2 text-lg font-medium hover:text-muted-foreground transition-colors">
                          Login
                        </Link>
                        <Link to="/auth" className="block py-2 text-lg font-medium hover:text-muted-foreground transition-colors">
                          Register
                        </Link>
                      </div>}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Logo - Centered */}
          <Link to="/" className="flex flex-col items-center text-2xl font-etna font-black text-[hsl(var(--header-footer-foreground))] tracking-wider leading-tight">
            <span>TEELITE</span>
            <span>CLUB</span>
          </Link>

          {/* Right side - Cart only */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="relative text-[hsl(var(--header-footer-foreground))] hover:bg-[hsl(var(--header-footer-foreground))]/10" asChild>
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {getCartItemsCount() > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {getCartItemsCount()}
                  </Badge>}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>;
}