import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/shop/HeroSection";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  gambar?: string[];
  stock_quantity?: number;
  is_active?: boolean;
  description?: string;
}

interface FilterState {
  categories: string[];
  sizes: string[];
  priceRange: [number, number];
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    sizes: [],
    priceRange: [0, 1000000],
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        filters.categories.some(category =>
          product.category.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: string) => {
    // For now, just show a toast. Will implement cart functionality later
    toast.success("Produk ditambahkan ke keranjang!", {
      description: "Silakan login untuk melanjutkan checkout",
    });
  };

  const handleViewDetails = (productId: string) => {
    // Navigate to product detail page
    window.location.href = `/product/${productId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Memuat produk...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchChange={setSearchQuery} />
      
      <HeroSection />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Semua Produk
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} produk ditemukan
              </p>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    Tidak ada produk yang ditemukan
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      categories: [],
                      sizes: [],
                      priceRange: [0, 1000000],
                    });
                  }}>
                    Reset Filter
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">TeeElite</h3>
              <p className="text-muted-foreground">
                Fashion berkualitas dengan harga terjangkau untuk semua kalangan.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>Email: info@teeelite.com</p>
                <p>Phone: +62 812-3456-7890</p>
                <p>WhatsApp: +62 812-3456-7890</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>Panduan Ukuran</p>
                <p>Kebijakan Return</p>
                <p>Pengiriman & Pembayaran</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-4 text-center text-muted-foreground">
            <p>&copy; 2024 TeeElite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
