import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id: string;
  jumlah: number;
  harga: number;
  ukuran: string;
  product?: {
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  nama_pembeli: string;
  email_pembeli: string;
  telepon_pembeli: string;
  shipping_address: string;
  payment_method: string;
  shipping_method: string;
  order_items: OrderItem[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Menunggu Pembayaran</Badge>;
      case 'paid':
        return <Badge variant="default">Dibayar</Badge>;
      case 'processing':
        return <Badge variant="outline">Diproses</Badge>;
      case 'shipped':
        return <Badge variant="outline">Dikirim</Badge>;
      case 'delivered':
        return <Badge variant="default">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            jumlah,
            harga,
            ukuran,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat riwayat pesanan');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Memuat riwayat pesanan...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Belum Ada Pesanan</h2>
              <p className="text-muted-foreground mb-4">
                Anda belum pernah melakukan pemesanan
              </p>
              <Button onClick={() => navigate('/shop')}>
                Mulai Belanja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Pesanan #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <div className="text-lg font-semibold mt-2">
                        {formatPrice(order.total)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3">Produk yang Dipesan</h4>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.product?.name || 'Produk tidak ditemukan'}</p>
                              <p className="text-sm text-muted-foreground">
                                Ukuran: {item.ukuran} • Qty: {item.jumlah}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.harga * item.jumlah)}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.harga)} × {item.jumlah}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-semibold mb-2">Informasi Pembeli</h5>
                        <p><strong>Nama:</strong> {order.nama_pembeli}</p>
                        <p><strong>Email:</strong> {order.email_pembeli}</p>
                        <p><strong>Telepon:</strong> {order.telepon_pembeli}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">Pengiriman & Pembayaran</h5>
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-4 w-4" />
                          <span className="capitalize">{order.payment_method}</span>
                        </div>
                        <p><strong>Pengiriman:</strong> {order.shipping_method === 'express' ? 'Express' : 'Reguler'}</p>
                        <p><strong>Alamat:</strong> {order.shipping_address}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;