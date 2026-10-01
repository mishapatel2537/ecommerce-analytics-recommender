import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import ReviewSection from '../components/ReviewSection.jsx';
import AlsoBoughtStrip from '../components/AlsoBoughtStrip.jsx';
import SegmentsChart from '../components/SegmentsChart.jsx';

// Demo host so Person C's UI can be built and tested without A's or B's pages.
export default function CDemo() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [productId, setProductId] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('testUserId') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('testRole') === 'admin');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/dev/products'), api.get('/dev/users')])
      .then(([p, u]) => {
        setProducts(p.data);
        setUsers(u.data);
        if (p.data.length) setProductId(p.data[0]._id);
      })
      .catch(() => setError('Could not reach the API. Is the server running and seeded?'));
  }, []);

  useEffect(() => {
    if (userId) localStorage.setItem('testUserId', userId);
    else localStorage.removeItem('testUserId');
    localStorage.setItem('testRole', isAdmin ? 'admin' : 'customer');
  }, [userId, isAdmin]);

  return (
    <div className="page">
      <h1>Person C demo</h1>
      <p className="muted">Reviews, also-bought and segments, hosted on a standalone page.</p>
      {error && <div className="error">{error}</div>}

      <div className="card controls">
        <label>
          Product
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Act as user (login stub)
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Logged out</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
          Admin
        </label>
      </div>

      {productId && (
        <>
          <div className="card">
            <ReviewSection key={`${productId}-${userId}`} productId={productId} isLoggedIn={!!userId} />
          </div>
          <div className="card">
            <AlsoBoughtStrip productId={productId} onSelect={setProductId} />
          </div>
        </>
      )}

      <div className="card">
        <SegmentsChart key={`${userId}-${isAdmin}`} />
      </div>
    </div>
  );
}
