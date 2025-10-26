<<<<<<< HEAD
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
      
=======
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali berbelanja
            </Link>
          </div>

          <Card className="overflow-hidden rounded-3xl border border-dashed border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex flex-col items-center gap-6 px-6 py-14 text-center">
              <div className="rounded-full bg-muted/80 p-5 text-muted-foreground">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Keranjang masih kosong
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Temukan koleksi terbaru kami dan tambahkan produk favorit Anda ke keranjang.
                </p>
              </div>
              <Button asChild className="rounded-full px-6">
                <Link to="/shop">Mulai Belanja</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="mb-8 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Lanjutkan berbelanja
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Keranjang Anda
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
                Siap checkout?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Periksa kembali detail produk sebelum melanjutkan ke proses pembayaran.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="self-start rounded-full px-4 py-2 text-sm">
            {getCartItemsCount()} item
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Order Summary */}
          <aside className="lg:order-2">
            <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm lg:sticky lg:top-6">
              <CardHeader className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Ringkasan
                </p>
                <CardTitle className="text-2xl text-foreground">Total pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ongkos kirim</span>
                    <span>Dihitung di checkout</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>

                <div className="space-y-2">
                  {user ? (
                    <Button className="w-full rounded-full py-5 text-base" asChild>
                      <Link to="/checkout">Lanjut ke checkout</Link>
                    </Button>
                  ) : (
                    <>
                      <Button className="w-full rounded-full py-5 text-base" asChild>
                        <Link to="/auth">Login untuk checkout</Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Atau lanjutkan sebagai guest di halaman checkout
                      </p>
                    </>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pajak dan biaya tambahan dihitung saat proses pembayaran selesai.
                  Pastikan alamat pengiriman sudah benar sebelum melanjutkan.
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Cart Items */}
          <section className="space-y-5 lg:order-1">
            {items.map((item) => {
              const imageUrl = item.product?.gambar?.[0] || item.product?.image_url || "/placeholder.svg";
              const price = item.product?.price || 0;

              return (
                <Card key={item.id} className="rounded-3xl border border-border/70 bg-card shadow-sm">
                  <CardContent className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-start">
                    <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-muted sm:h-32 sm:w-32">
                      <img
                        src={imageUrl}
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {item.product?.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="rounded-full border-border/80 px-3 py-1 text-xs uppercase tracking-[0.18em]">
                              Ukuran {item.ukuran}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="self-start rounded-full text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-10 w-10 rounded-full"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="h-10 w-16 rounded-full border-border/70 text-center text-base"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-10 w-10 rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {formatPrice(price * item.quantity)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(price)} / item
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      </div>

>>>>>>> c78eca0 (Update Maintenance)
      <Footer />
    </div>
  );
};

<<<<<<< HEAD
export default Cart;
=======
export default Cart;
>>>>>>> c78eca0 (Update Maintenance)
