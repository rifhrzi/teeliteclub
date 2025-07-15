import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  gambar?: string[];
  stock_quantity?: number;
  is_active?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const imageUrl = product.gambar?.[0] || product.image_url || "/placeholder.svg";
  const isOutOfStock = product.stock_quantity === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary">Stok Habis</Badge>
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onViewDetails?.(product.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-2">
              {product.name}
            </h3>
            <Badge variant="outline" className="text-xs ml-2">
              {product.category}
            </Badge>
          </div>
          <p className="text-lg font-bold text-primary mb-3">
            {formatPrice(product.price)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => onAddToCart?.(product.id)}
          disabled={isOutOfStock || !product.is_active}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
        </Button>
      </CardFooter>
    </Card>
  );
}