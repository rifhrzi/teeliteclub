import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  ukuran: string;
  user_id?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    gambar?: string[];
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, ukuran: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Load from localStorage for guest users
        const localCart = localStorage.getItem('cart');
        if (localCart) {
          setItems(JSON.parse(localCart));
        }
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(id, name, price, image_url, gambar)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Gagal memuat keranjang');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, ukuran: string, quantity = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Handle guest cart in localStorage
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = localCart.find((item: CartItem) => 
          item.product_id === productId && item.ukuran === ukuran
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          // Get product details
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          localCart.push({
            id: Date.now().toString(),
            product_id: productId,
            quantity,
            ukuran,
            product
          });
        }

        localStorage.setItem('cart', JSON.stringify(localCart));
        setItems(localCart);
        toast.success('Produk ditambahkan ke keranjang!');
        return;
      }

      // Check if item already exists in cart
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('ukuran', ukuran);

      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const newQuantity = existingItems[0].quantity + quantity;
        await updateQuantity(existingItems[0].id, newQuantity);
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            user_id: user.id,
            product_id: productId,
            quantity,
            ukuran
          }]);

        if (error) throw error;
        await loadCartItems();
        toast.success('Produk ditambahkan ke keranjang!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Gagal menambahkan ke keranjang');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = localCart.map((item: CartItem) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setItems(updatedCart);
        return;
      }

      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      await loadCartItems();
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Gagal mengupdate keranjang');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = localCart.filter((item: CartItem) => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setItems(updatedCart);
        toast.success('Item dihapus dari keranjang');
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadCartItems();
      toast.success('Item dihapus dari keranjang');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Gagal menghapus dari keranjang');
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        localStorage.removeItem('cart');
        setItems([]);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
      toast.success('Keranjang dikosongkan');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Gagal mengosongkan keranjang');
    }
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}