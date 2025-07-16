import { Facebook, Instagram, Twitter } from "lucide-react";

// Footer component for consistent layout across all pages
export const Footer = () => {
  return (
    <footer className="bg-background border-t py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Brand */}
          <h3 className="text-lg font-anton text-dark-blue">TEELITECLUB</h3>
          
          {/* Social Media */}
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-muted-foreground text-xs">
            &copy; 2024 TEELITECLUB. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};