import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  gambar?: string[];
  stock_quantity: number;
  ukuran?: string[];
  is_active?: boolean;
}

interface ProductSize {
  ukuran: string;
  stok: number;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);

  const fetchProductSizes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_sizes")
        .select("ukuran, stok")
        .eq("product_id", product.id);

      if (error) throw error;
      setProductSizes(data || []);
    } catch (error) {
      console.error("Error fetching product sizes:", error);
    }
  }, [product.id]);

  useEffect(() => {
    fetchProductSizes();
  }, [fetchProductSizes]);

  const getTotalStock = () => {
    return productSizes.reduce((total, size) => total + size.stok, 0);
  };

  const getSelectedSizeStock = () => {
    if (!selectedSize) return 0;
    const sizeData = productSizes.find(size => size.ukuran === selectedSize);
    return sizeData?.stok || 0;
  };

  const isOutOfStock = () => {
    return getTotalStock() === 0;
  };

  const isSelectedSizeOutOfStock = () => {
    return selectedSize && getSelectedSizeStock() === 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const getProductImage = () => {
    if (product.gambar && product.gambar.length > 0) {
      return product.gambar[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop";
  };

  const handleAddToCart = async () => {
    if (!selectedSize && product.ukuran && product.ukuran.length > 0) {
      toast({
        title: "Error",
        description: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart(product.id, selectedSize || "", 1);
      toast({
        title: "Success",
        description: `${product.name} added to cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg border-0 bg-card">
      <div className="aspect-square overflow-hidden bg-muted">
        <Link to={`/product/${product.id}`}>
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            <Badge variant={getTotalStock() > 0 ? "default" : "destructive"} className="text-xs">
              {getTotalStock() > 0 ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          <p className="font-bold text-xl text-primary">
            {formatCurrency(product.price)}
          </p>
        </div>

        {/* Add to Cart Button - Navigate to product detail */}
        <Button
          onClick={() => window.location.href = `/product/${product.id}`}
          disabled={isOutOfStock()}
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isOutOfStock() ? "Stok Habis" : "Lihat Detail"}
        </Button>

      </CardContent>
    </Card>
  );
}