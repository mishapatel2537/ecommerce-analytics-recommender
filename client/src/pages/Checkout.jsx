import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSummary from '../components/CartSummary';
import api from '../api/axios'; // from Person A

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    try {
      setLoading(true);
      setError('');
      await api.post('/orders/checkout');
      await fetchCart();          // cart is now empty
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) return <div style={{ padding: 24 }}>Nothing to check out.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>Checkout</h2>
      <ul>
        {cart.items.map(i => (
          <li key={i.productId?._id}>{i.productId?.name} × {i.quantity}</li>
        ))}
      </ul>
      <p>No real payment is taken in this project.</p>
      <CartSummary items={cart.items}>
        <button onClick={placeOrder} disabled={loading}>
          {loading ? 'Placing order...' : 'Place Order'}
        </button>
      </CartSummary>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}