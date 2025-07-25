import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { MaintenanceWrapper } from "@/components/MaintenanceWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Core pages (loaded immediately)
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import TestConnection from "./pages/TestConnection";
import DebugProducts from "./pages/DebugProducts";
import SimpleTest from "./pages/SimpleTest";
import NotFound from "./pages/NotFound";

// Auth and user pages (lazy loaded)
const Auth = lazy(() => import("./pages/Auth"));
const Cart = lazy(() => import("./pages/Cart"));
const Account = lazy(() => import("./pages/Account"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const FinishPayment = lazy(() => import("./pages/FinishPayment"));
const PaymentError = lazy(() => import("./pages/PaymentError"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));

// Admin pages (lazy loaded - biggest impact on bundle size)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const Users = lazy(() => import("./pages/admin/Users"));
const Reports = lazy(() => import("./pages/admin/Reports"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-600">Loading Teelitee Club...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MaintenanceWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/finish-payment" element={<FinishPayment />} />
                <Route path="/payment-error" element={<PaymentError />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="/test-connection" element={<TestConnection />} />
                <Route path="/debug-products" element={<DebugProducts />} />
                <Route path="/simple-test" element={<SimpleTest />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MaintenanceWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
