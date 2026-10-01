import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios'; // from Person A

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data)).catch(() => setProduct(null));
  }, [id]);

  const handleAdd = async () => {
    try {
      await addToCart(product._id, qty);
      setMessage('Added to cart!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Please log in first');
    }
  };

  if (!product) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>{product.name}</h2>
      <p>{product.category}</p>
      <h3>₹{product.price}</h3>
      <p>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

      <input
        type="number" min="1" max={product.stock} value={qty}
        onChange={e => setQty(Number(e.target.value))}
      />
      <button onClick={handleAdd} disabled={product.stock === 0}>Add to Cart</button>
      {message && <p>{message}</p>}

      {/* Slots for Person C */}
      {/* <ReviewSection productId={product._id} /> */}
      {/* <AlsoBoughtStrip productId={product._id} /> */}
    </div>
  );
}