import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Calendar, CreditCard, Truck, ChevronDown, ChevronUp, RefreshCw, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/Footer";
import { OrdersSkeleton } from "@/components/loading/OrdersSkeleton";

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
  payment_url?: string;
  shipping_method: string;
  tracking_number?: string;
  order_items: OrderItem[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  console.log('Orders page - user:', user?.id, 'email:', user?.email);

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

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleContinuePayment = (paymentUrl: string, orderNumber: string) => {
    if (!paymentUrl) {
      toast.error('Link pembayaran tidak tersedia');
      return;
    }
    
    console.log('Continuing payment for order:', orderNumber);
    console.log('Payment URL:', paymentUrl);
    
    // Open payment URL in new tab
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    
    toast.success('Halaman pembayaran dibuka di tab baru');
  };

  useEffect(() => {
    console.log('Orders useEffect - user:', user);
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    console.log('User found, fetching orders');
    fetchOrders();
  }, [user, navigate]);

  // Add an effect to refresh orders when the page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Page became visible, refreshing orders');
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('No user ID available for fetching orders');
        toast.error('User not authenticated');
        return;
      }

      console.log('Fetching orders for user ID:', user.id);

      // First, try a simple query to test connectivity
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id, order_number, user_id')
        .limit(5);

      if (testError) {
        console.error('Test query failed:', testError);
      } else {
        console.log('Test query successful, total orders in DB:', testData?.length);
        console.log('Sample orders:', testData);
      }

      // Now fetch user's orders - using robust approach to avoid relationship errors
      console.log('Fetching user orders...');
      
      // First, get orders without relationships
      // Try to fetch with payment_url, fallback if field doesn't exist
      console.log('Orders fetchOrders - Attempting full query with all fields...');
      
      const fullResult = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      let ordersData, ordersError;
      
      // Check if the error is due to missing payment_url column
      if (fullResult.error && fullResult.error.code === '42703' && fullResult.error.message.includes('payment_url')) {
        console.warn("Orders fetchOrders - payment_url column doesn't exist, using fallback query");
        const fallbackResult = await supabase
          .from('orders')
          .select('id, order_number, total, status, created_at, nama_pembeli, email_pembeli, telepon_pembeli, shipping_address, payment_method, shipping_method, tracking_number, updated_at, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        ordersData = fallbackResult.data;
        ordersError = fallbackResult.error;
        console.log('Orders fetchOrders - Fallback query result:', { 
          dataLength: ordersData?.length, 
          error: ordersError?.message 
        });
      } else {
        ordersData = fullResult.data;
        ordersError = fullResult.error;
        console.log('Orders fetchOrders - Full query result:', { 
          dataLength: ordersData?.length, 
          error: ordersError?.message 
        });
      }

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      console.log('Fetched orders:', ordersData?.length || 0, 'orders found');

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Now fetch order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          try {
            // Try relationship query first
            const { data: relationshipData, error: relationshipError } = await supabase
              .from('order_items')
              .select(`
                id,
                product_id,
                jumlah,
                harga,
                ukuran,
                product:products!order_items_product_id_fkey (
                  name,
                  image_url
                )
              `)
              .eq('order_id', order.id);

            if (relationshipError) {
              console.warn(`Relationship query failed for order ${order.id}, using fallback:`, relationshipError);
              
              // Fallback: Load order items and products separately
              const { data: simpleItemsData, error: simpleItemsError } = await supabase
                .from('order_items')
                .select('id, product_id, jumlah, harga, ukuran')
                .eq('order_id', order.id);

              if (simpleItemsError) {
                console.error(`Error fetching order items for order ${order.id}:`, simpleItemsError);
                return { ...order, order_items: [] };
              }

              // Get unique product IDs
              const productIds = [...new Set(simpleItemsData?.map(item => item.product_id))] as string[];
              
              if (productIds.length > 0) {
                // Load products separately
                const { data: productsData, error: productsError } = await supabase
                  .from('products')
                  .select('id, name, image_url')
                  .in('id', productIds);

                if (productsError) {
                  console.error(`Error fetching products for order ${order.id}:`, productsError);
                  return { ...order, order_items: simpleItemsData || [] };
                }

                // Combine the data manually
                const itemsWithProducts = simpleItemsData?.map(item => ({
                  ...item,
                  product: productsData?.find(product => product.id === item.product_id)
                }));

                return { ...order, order_items: itemsWithProducts || [] };
              } else {
                return { ...order, order_items: simpleItemsData || [] };
              }
            }

            return { ...order, order_items: relationshipData || [] };
          } catch (itemError) {
            console.error(`Error loading items for order ${order.id}:`, itemError);
            return { ...order, order_items: [] };
          }
        })
      );

      console.log('Orders with items loaded:', ordersWithItems);
      setOrders(ordersWithItems);
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
          <OrdersSkeleton />
        </div>
        <Footer />
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

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
              
              {/* Debug info when no orders */}
              <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
                <h3 className="font-semibold mb-2">Debug Info:</h3>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Query completed:</strong> Yes</p>
              </div>
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
                    <div className="text-right space-y-2">
                      {getStatusBadge(order.status)}
                      <div className="text-lg font-semibold">
                        {formatPrice(order.total)}
                      </div>
                      {/* Continue Payment Button for pending orders */}
                      {order.status === 'pending' && order.payment_url && (
                        <Button
                          size="sm"
                          onClick={() => handleContinuePayment(order.payment_url!, order.order_number)}
                          className="w-full flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Lanjutkan Pembayaran
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Summary - Always visible */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {order.order_items.length} produk
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Detail
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderDetails(order.id)}
                          className="flex items-center gap-2"
                        >
                          {expandedOrders.has(order.id) ? 'Sembunyikan' : 'Lihat Ringkasan'}
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedOrders.has(order.id) && (
                      <>
                        <Separator />
                        
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
                            
                            {/* Display tracking number if order is shipped */}
                            {order.status === 'shipped' && order.tracking_number && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-1">
                                  <Truck className="h-4 w-4 text-blue-600" />
                                  <span className="font-semibold text-blue-600">Nomor Resi</span>
                                </div>
                                <p className="font-mono text-sm font-medium">{order.tracking_number}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Gunakan nomor resi ini untuk melacak paket Anda
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Tracking number - Always visible if shipped */}
                    {!expandedOrders.has(order.id) && order.status === 'shipped' && order.tracking_number && (
                      <>
                        <Separator />
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-600">Nomor Resi</span>
                          </div>
                          <p className="font-mono text-sm font-medium">{order.tracking_number}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Gunakan nomor resi ini untuk melacak paket Anda
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Orders;