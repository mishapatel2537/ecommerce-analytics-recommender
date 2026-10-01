import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios'; // from Person A
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart({ items: [] }); // not logged in, or cart empty
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchCart().finally(() => setLoading(false));
    } else {
      setCart({ items: [] });
      setDrawerOpen(false);
    }
  }, [user, fetchCart]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      await api.post('/cart', { productId, quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      await api.put(`/cart/${productId}`, { quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const removeItem = useCallback(
    async (productId) => {
      await api.delete(`/cart/${productId}`);
      await fetchCart();
    },
    [fetchCart]
  );

  const value = useMemo(() => {
    const items = cart.items.filter((i) => i.productId); // skip products deleted since they were added
    return {
      cart,
      items,
      loading,
      cartCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0),
      fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
      drawerOpen,
      openCart: () => setDrawerOpen(true),
      closeCart: () => setDrawerOpen(false),
    };
  }, [cart, loading, drawerOpen, fetchCart, addToCart, updateQuantity, removeItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
