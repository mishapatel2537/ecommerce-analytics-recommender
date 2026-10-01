import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';

/**
 * One place for "add to cart" behaviour: sends logged-out users to login,
 * tracks which product is busy, and confirms with a toast.
 *   const { add, busyId } = useAddToCart();
 *   add(product, 2)                  -> toast with "View cart"
 *   add(product, 1, { thenCart })    -> go straight to /cart
 */
export default function useAddToCart() {
  const { user } = useAuth();
  const { addToCart, openCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busyId, setBusyId] = useState(null);

  const add = async (product, quantity = 1, { thenCart = false } = {}) => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return false;
    }
    setBusyId(product._id);
    try {
      await addToCart(product._id, quantity);
      if (thenCart) navigate('/cart');
      else
        toast({
          title: 'Added to cart',
          text: quantity > 1 ? `${product.name} × ${quantity}` : product.name,
          action: { label: 'View cart', onClick: openCart },
        });
      return true;
    } catch (err) {
      toast({ tone: 'error', title: 'Could not add to cart', text: errorMessage(err) });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { add, busyId };
}
