import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, Package, Calendar, ExternalLink } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { AccountSkeleton, AccountOrdersSkeleton } from "@/components/loading/AccountSkeleton";
import { toast as sonnerToast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  payment_url?: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  console.log('Account page - user:', user?.id, 'profile:', profile?.id);
  
  const [formData, setFormData] = useState({
    nama: profile?.nama || "",
    telepon: profile?.telepon || "",
    alamat: profile?.alamat || "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nama: profile.nama || "",
        telepon: profile.telepon || "",
        alamat: profile.alamat || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user?.id) {
        console.error('User not authenticated for fetchOrders');
        setLoadingOrders(false);
        return;
      }

      console.log('Fetching orders for user:', user.id);

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, payment_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching orders:", error);
        throw error;
      }

      console.log('Orders fetched successfully:', data?.length || 0, 'orders');
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleContinuePayment = (paymentUrl: string, orderNumber: string) => {
    if (!paymentUrl) {
      toast({
        title: "Error",
        description: "Link pembayaran tidak tersedia",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Continuing payment for order:', orderNumber);
    console.log('Payment URL:', paymentUrl);
    
    // Open payment URL in new tab
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    
    sonnerToast.success('Halaman pembayaran dibuka di tab baru');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Please log in to view your account.</p>
              <Button onClick={() => window.location.href = '/auth'} className="mt-4">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Akun Saya</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="orders">Pesanan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nama">Name</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telepon">Phone</Label>
                    <Input
                      id="telepon"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Address</Label>
                    <Input
                      id="alamat"
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      placeholder="Enter your address"
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <AccountOrdersSkeleton />
                ) : orders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No orders found. Start shopping to see your orders here!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="p-0">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">Pesanan #{order.order_number}</p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {formatDate(order.created_at)}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(order.status)}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="font-semibold text-lg">{formatCurrency(order.total)}</p>
                              <div className="flex flex-col gap-2">
                                {/* Continue Payment Button for pending orders */}
                                {order.status === 'pending' && order.payment_url && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleContinuePayment(order.payment_url!, order.order_number)}
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Lanjutkan Pembayaran
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Lihat Detail
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/orders')}
                        className="w-full"
                      >
                        Lihat Semua Pesanan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Account;