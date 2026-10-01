import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import ProductHero from '../components/ProductHero.jsx';
import ReviewSection from '../components/ReviewSection.jsx';
import AlsoBoughtStrip from '../components/AlsoBoughtStrip.jsx';

export default function Storefront({ user }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [summary, setSummary] = useState({ avgRating: 0, count: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dev/products')
      .then((res) => {
        setProducts(res.data);
        if (res.data.length) setProductId(res.data[0]._id);
      })
      .catch(() => setError('Could not reach the server. Make sure it is running and the database is seeded.'));
  }, []);

  const product = products.find((p) => p._id === productId);

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <label>
          <span>Browse products</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      {productId && (
        <>
          <ProductHero product={product} summary={summary} />
          <ReviewSection key={productId} productId={productId} isLoggedIn={!!user} onSummary={setSummary} />
          <AlsoBoughtStrip productId={productId} onSelect={setProductId} />
        </>
      )}
    </>
  );
}
