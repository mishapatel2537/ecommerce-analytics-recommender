import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios'; // from Person A
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      setCart({ items: [] }); // not logged in, or cart empty
    }
  }, []);

  useEffect(() => {
  if (user) fetchCart();
  else setCart({ items: [] });
}, [user, fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    await api.post('/cart', { productId, quantity });
    await fetchCart();
  };

  const updateQuantity = async (productId, quantity) => {
    await api.put(`/cart/${productId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (productId) => {
    await api.delete(`/cart/${productId}`);
    await fetchCart();
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, fetchCart, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}