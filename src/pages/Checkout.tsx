import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/Footer";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_pembeli: "",
    email_pembeli: "",
    telepon_pembeli: "",
    shipping_address: "",
    payment_method: "transfer",
    shipping_method: "regular"
  });

  // Auto-populate form with user data when available
  useEffect(() => {
    if (user && profile) {
      setFormData(prevData => ({
        ...prevData,
        nama_pembeli: profile.nama || "",
        email_pembeli: user.email || "",
        telepon_pembeli: profile.telepon || "",
        shipping_address: profile.alamat || "",
      }));
    } else if (user && !profile) {
      // If we have user but no profile yet, at least populate email
      setFormData(prevData => ({
        ...prevData,
        email_pembeli: user.email || "",
      }));
    }
  }, [user, profile]);

  // Helper function to check if a field is auto-filled from profile
  const isAutoFilled = (fieldName: string) => {
    if (!user && !profile) return false;
    
    switch (fieldName) {
      case 'nama_pembeli':
        return !!(profile?.nama && formData.nama_pembeli === profile.nama);
      case 'email_pembeli':
        return !!(user?.email && formData.email_pembeli === user.email);
      case 'telepon_pembeli':
        return !!(profile?.telepon && formData.telepon_pembeli === profile.telepon);
      case 'shipping_address':
        return !!(profile?.alamat && formData.shipping_address === profile.alamat);
      default:
        return false;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setLoading(true);
    try {
      // Validate form data first
      if (!formData.nama_pembeli || formData.nama_pembeli.trim().length < 2) {
        toast.error('Nama lengkap harus diisi minimal 2 karakter');
        return;
      }
      if (!formData.email_pembeli || !formData.email_pembeli.includes('@')) {
        toast.error('Email valid harus diisi');
        return;
      }
      if (!formData.telepon_pembeli || formData.telepon_pembeli.length < 8) {
        toast.error('Nomor telepon valid harus diisi');
        return;
      }
      if (!formData.shipping_address || formData.shipping_address.trim().length < 10) {
        toast.error('Alamat pengiriman harus diisi lengkap');
        return;
      }

      // Get fresh session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('User session:', session.session?.user?.email || 'NOT LOGGED IN');
      
      if (sessionError || !session.session?.user) {
        console.error('Session error:', sessionError);
        toast.error('Silakan login terlebih dahulu');
        navigate('/auth');
        return;
      }
      
      // CRITICAL: Validate stock for all items before proceeding
      console.log('Validating stock for checkout...');
      for (const item of items) {
        const { data: stockData, error: stockError } = await supabase
          .from('product_sizes')
          .select('stok')
          .eq('product_id', item.product_id)
          .eq('ukuran', item.ukuran)
          .single();

        if (stockError) {
          console.error('Stock validation error:', stockError);
          toast.error('Gagal memvalidasi stok produk');
          return;
        }

        if (!stockData || stockData.stok < item.quantity) {
          toast.error(`Stok tidak mencukupi untuk ${item.product?.name} ukuran ${item.ukuran}. Stok tersedia: ${stockData?.stok || 0}`);
          return;
        }
      }

      const orderData = {
        total: getCartTotal() + (formData.shipping_method === 'express' ? 20000 : 0),
        nama_pembeli: formData.nama_pembeli,
        email_pembeli: formData.email_pembeli,
        telepon_pembeli: formData.telepon_pembeli,
        shipping_address: formData.shipping_address,
        payment_method: 'midtrans', // Always use Midtrans
        shipping_method: formData.shipping_method,
        status: 'pending'
      };

      // Create Midtrans payment
      console.log('Calling Midtrans payment function...');
      
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-midtrans-payment',
        {
          body: {
            orderData,
            items
          }
        }
      );

      console.log('Payment response:', { paymentData, paymentError });
      
      if (paymentError) {
        console.error('Payment error details:', paymentError);
        
        // Handle specific error types
        if (paymentError.message && paymentError.message.includes('401')) {
          toast.error('Sesi berakhir, silakan login kembali');
          navigate('/auth');
          return;
        }
        
        if (paymentError.message && paymentError.message.includes('Insufficient stock')) {
          toast.error('Stok produk tidak mencukupi, silakan periksa keranjang Anda');
          navigate('/cart');
          return;
        }
        
        if (paymentError.message && paymentError.message.includes('MIDTRANS_SERVER_KEY')) {
          toast.error('Konfigurasi pembayaran bermasalah, silakan hubungi admin');
          return;
        }
        
        // Generic error handling
        const errorMessage = paymentError.message || 'Gagal membuat pembayaran';
        throw new Error(errorMessage);
      }

      if (!paymentData || !paymentData.redirect_url) {
        throw new Error('Respons pembayaran tidak valid');
      }

      // DON'T clear cart here - only clear after successful payment confirmation
      console.log('Payment created successfully, redirecting to Midtrans...');

      // Redirect to Midtrans payment page
      window.location.href = paymentData.redirect_url;
    } catch (error) {
      console.error('Error creating payment:', error);
      
      // Handle different types of errors
      let errorMessage = 'Gagal membuat pembayaran';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error message
      toast.error(errorMessage);
      
      // Log detailed error for debugging
      console.error('Payment creation failed:', {
        error,
        formData,
        itemsCount: items.length,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/cart')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Keranjang
          </Button>
          
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Keranjang Kosong</h2>
              <p className="text-muted-foreground mb-4">
                Silakan tambahkan produk ke keranjang terlebih dahulu
              </p>
              <Button onClick={() => navigate('/shop')}>
                Belanja Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Keranjang
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
              {user && (profile?.nama || profile?.telepon || profile?.alamat) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Informasi Anda telah diisi otomatis dari profil</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Anda dapat mengedit informasi di bawah jika diperlukan
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nama_pembeli">Nama Lengkap</Label>
                    {isAutoFilled('nama_pembeli') && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Diisi otomatis</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="nama_pembeli"
                    name="nama_pembeli"
                    value={formData.nama_pembeli}
                    onChange={handleInputChange}
                    className={isAutoFilled('nama_pembeli') ? "border-green-200 bg-green-50" : ""}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email_pembeli">Email</Label>
                    {isAutoFilled('email_pembeli') && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Diisi otomatis</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="email_pembeli"
                    name="email_pembeli"
                    type="email"
                    value={formData.email_pembeli}
                    onChange={handleInputChange}
                    className={isAutoFilled('email_pembeli') ? "border-green-200 bg-green-50" : ""}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="telepon_pembeli">Nomor Telepon</Label>
                    {isAutoFilled('telepon_pembeli') && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Diisi otomatis</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="telepon_pembeli"
                    name="telepon_pembeli"
                    value={formData.telepon_pembeli}
                    onChange={handleInputChange}
                    className={isAutoFilled('telepon_pembeli') ? "border-green-200 bg-green-50" : ""}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="shipping_address">Alamat Pengiriman</Label>
                    {isAutoFilled('shipping_address') && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Diisi otomatis</span>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    className={isAutoFilled('shipping_address') ? "border-green-200 bg-green-50" : ""}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Metode Pengiriman</Label>
                  <RadioGroup 
                    value={formData.shipping_method} 
                    onValueChange={(value) => setFormData({...formData, shipping_method: value})}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="regular" />
                      <Label htmlFor="regular">Reguler (5-7 hari) - Gratis</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express">Express (2-3 hari) - Rp 20.000</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Metode Pembayaran</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-primary"></div>
                      <Label className="font-medium">Midtrans Payment Gateway</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pembayaran aman dengan berbagai metode: Transfer Bank, E-Wallet, Kartu Kredit/Debit
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Buat Pesanan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.ukuran}`} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ukuran: {item.ukuran} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Ongkos Kirim</span>
                  <span>{formData.shipping_method === 'express' ? formatPrice(20000) : 'Gratis'}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    {formatPrice(getCartTotal() + (formData.shipping_method === 'express' ? 20000 : 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Checkout;