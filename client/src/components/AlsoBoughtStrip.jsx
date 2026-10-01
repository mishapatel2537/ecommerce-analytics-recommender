import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { categoryColor, formatINR } from '../utils/theme.js';

// <AlsoBoughtStrip productId={id} />                       cards link to /products/:id
// <AlsoBoughtStrip productId={id} onSelect={(id) => ...} /> cards call your handler
export default function AlsoBoughtStrip({ productId, onSelect }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    api
      .get(`/products/${productId}/also-bought`)
      .then((res) => !cancelled && setItems(res.data))
      .catch(() => !cancelled && setError('Could not load suggestions.'));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) return <div className="error">{error}</div>;
  if (!items.length) return null;

  return (
    <section className="panel">
      <h2>Customers also bought</h2>
      <div className="strip">
        {items.map((p) => {
          const color = categoryColor(p.category);
          const body = (
            <>
              <div className="pcard-art" style={{ background: `linear-gradient(135deg, ${color}, ${color}b3)` }}>
                {p.name.charAt(0)}
              </div>
              <div className="pcard-body">
                <div className="pcard-name">{p.name}</div>
                <div className="pcard-cat">{p.category}</div>
                <div className="pcard-price">{formatINR(p.price)}</div>
                <div className="pcard-note">Bought together {p.count} time{p.count === 1 ? '' : 's'}</div>
              </div>
            </>
          );
          return onSelect ? (
            <button key={p.productId} className="pcard" onClick={() => onSelect(p.productId)}>
              {body}
            </button>
          ) : (
            <a key={p.productId} className="pcard" href={`/products/${p.productId}`}>
              {body}
            </a>
          );
        })}
      </div>
    </section>
  );
}
