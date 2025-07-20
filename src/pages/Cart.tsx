import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { CartSkeleton } from "@/components/loading/PageSkeleton";

const Cart = () => {
  const { items, loading, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CartSkeleton />
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali berbelanja
              </Link>
            </div>
            
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Keranjang Kosong</h2>
                <p className="text-muted-foreground mb-6 text-center">
                  Belum ada produk di keranjang Anda. Mari mulai berbelanja!
                </p>
                <Button asChild>
                  <Link to="/">Mulai Berbelanja</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Lanjutkan berbelanja
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
                <Badge variant="secondary">{getCartItemsCount()} item</Badge>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const imageUrl = item.product?.gambar?.[0] || item.product?.image_url || "/placeholder.svg";
                  const price = item.product?.price || 0;

                  return (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={imageUrl}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{item.product?.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Ukuran: {item.ukuran}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold">{formatPrice(price * item.quantity)}</p>
                                <p className="text-sm text-muted-foreground">{formatPrice(price)} /item</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getCartItemsCount()} item)</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Ongkos Kirim</span>
                    <span className="text-muted-foreground">Dihitung di checkout</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {user ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link to="/checkout">Lanjut ke Checkout</Link>
                      </Button>
                    ) : (
                      <>
                        <Button className="w-full" size="lg" asChild>
                          <Link to="/auth">Login untuk Checkout</Link>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Atau lanjutkan sebagai guest di checkout
                        </p>
                      </>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Pajak dan biaya tambahan dihitung di halaman pembayaran
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Cart;