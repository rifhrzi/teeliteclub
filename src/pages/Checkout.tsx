import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/Footer";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_pembeli: "",
    email_pembeli: "",
    telepon_pembeli: "",
    shipping_address: "",
    payment_method: "transfer",
    shipping_method: "regular"
  });

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
      // Generate order number
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      
      const orderData = {
        user_id: user.id,
        order_number: orderNumberData,
        total: getCartTotal(),
        nama_pembeli: formData.nama_pembeli,
        email_pembeli: formData.email_pembeli,
        telepon_pembeli: formData.telepon_pembeli,
        shipping_address: formData.shipping_address,
        payment_method: formData.payment_method,
        shipping_method: formData.shipping_method,
        status: 'pending'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        jumlah: item.quantity,
        harga: item.product?.price || 0,
        ukuran: item.ukuran
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock quantities
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Error fetching product:', productError);
          continue;
        }

        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);

        if (updateError) {
          console.error('Error updating stock:', updateError);
        }
      }

      // Clear cart
      await clearCart();

      toast.success('Pesanan berhasil dibuat!');
      navigate('/account');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal membuat pesanan');
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nama_pembeli">Nama Lengkap</Label>
                  <Input
                    id="nama_pembeli"
                    name="nama_pembeli"
                    value={formData.nama_pembeli}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email_pembeli">Email</Label>
                  <Input
                    id="email_pembeli"
                    name="email_pembeli"
                    type="email"
                    value={formData.email_pembeli}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telepon_pembeli">Nomor Telepon</Label>
                  <Input
                    id="telepon_pembeli"
                    name="telepon_pembeli"
                    value={formData.telepon_pembeli}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_address">Alamat Pengiriman</Label>
                  <Textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
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
                  <RadioGroup 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData({...formData, payment_method: value})}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer">Transfer Bank</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Bayar di Tempat (COD)</Label>
                    </div>
                  </RadioGroup>
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