import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");

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
            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
              {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
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

        <div className="space-y-2">
          {/* Size Selection */}
          {product.ukuran && product.ukuran.length > 0 && (
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {product.ukuran.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || (product.ukuran && product.ukuran.length > 0 && !selectedSize)}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}