<<<<<<< HEAD
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
=======
import {
  ShoppingCart,
  Menu,
  LogOut,
  Sparkles,
  ShoppingBag,
  CircleUser,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type MenuLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function Header() {
>>>>>>> c78eca0 (Update Maintenance)
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const {
    getCartItemsCount
  } = useCart();
<<<<<<< HEAD
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(searchQuery);
  };
  const navigationItems = [];
=======

  const primaryLinks: MenuLink[] = [
    {
      label: "Shop",
      href: "/shop",
      icon: ShoppingBag
    },
    {
      label: "New Arrivals",
      href: "/shop#new-arrivals",
      icon: Sparkles
    },
    {
      label: "Orders",
      href: "/orders",
      icon: Receipt
    },
    {
      label: "Cart",
      href: "/cart",
      icon: ShoppingCart
    }
  ];

  const profileLink: MenuLink = user ? {
    label: "Profile",
    href: "/account",
    icon: CircleUser
  } : {
    label: "Sign In",
    href: "/auth",
    icon: CircleUser
  };

  const menuLinks: MenuLink[] = [...primaryLinks, profileLink];

  const renderMenuLink = (link: MenuLink) => {
    const Icon = link.icon;
    return (
      <SheetClose asChild key={link.label}>
        <Link
          to={link.href}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-muted"
        >
          <Icon className="h-5 w-5 text-black" />
          <span className="text-base font-medium text-foreground">{link.label}</span>
        </Link>
      </SheetClose>
    );
  };

>>>>>>> c78eca0 (Update Maintenance)
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
<<<<<<< HEAD
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
=======
              <SheetContent side="left" className="p-0 sm:max-w-sm">
                <div className="flex h-full flex-col bg-background font-helvetica">
                  <div className="border-b border-border/70 px-5 py-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      Menu
                    </p>
                    {user ? (
                      <p className="mt-2 text-base font-medium text-foreground">
                        {profile?.nama || user.email}
                      </p>
                    ) : (
                      <p className="mt-2 text-base font-medium text-foreground">
                        Teelite Club
                      </p>
                    )}
                  </div>

                  <nav className="flex-1 overflow-y-auto px-2 py-6 sm:px-4">
                    <ul className="space-y-1">
                      {menuLinks.map(link => (
                        <li key={link.label}>
                          {renderMenuLink(link)}
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="border-t border-border/70 px-5 py-5">
                    {user ? (
                      <Button
                        onClick={signOut}
                        variant="ghost"
                        className="flex w-full items-center justify-center gap-2 text-destructive hover:text-destructive/80"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    ) : (
                      <SheetClose asChild>
                        <Link
                          to="/auth"
                          className="block text-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          Already a member? Sign in
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>
>>>>>>> c78eca0 (Update Maintenance)
              </SheetContent>
            </Sheet>
          </div>
          
<<<<<<< HEAD
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
=======
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
>>>>>>> c78eca0 (Update Maintenance)
