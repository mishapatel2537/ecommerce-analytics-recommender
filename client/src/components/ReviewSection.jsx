import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import StarRating from './StarRating.jsx';
import ReviewList from './ReviewList.jsx';
import ReviewForm from './ReviewForm.jsx';

// <ReviewSection productId={id} isLoggedIn={!!user} onSummary={(s) => ...} />
export default function ReviewSection({ productId, isLoggedIn, onSummary }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, count: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [list, sum] = await Promise.all([
        api.get(`/products/${productId}/reviews`),
        api.get(`/products/${productId}/reviews/summary`),
      ]);
      setReviews(list.data);
      setSummary(sum.data);
      onSummary && onSummary(sum.data);
    } catch (err) {
      setError('Could not load reviews right now.');
    } finally {
      setLoading(false);
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const dist = summary.distribution || {};

  return (
    <section className="panel">
      <h2>Ratings and reviews</h2>
      <div className="reviews-layout">
        <aside className="reviews-side">
          <div className="score">
            <div className="score-number">{summary.avgRating || '-'}</div>
            <div>
              <StarRating value={summary.avgRating} size={20} />
              <div className="muted">{summary.count} review{summary.count === 1 ? '' : 's'}</div>
            </div>
          </div>

          <div className="bars">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = dist[n] || 0;
              const pct = summary.count ? (c / summary.count) * 100 : 0;
              return (
                <div className="bar-row" key={n}>
                  <span>{n}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="bar-count">{c}</span>
                </div>
              );
            })}
          </div>

          {isLoggedIn ? (
            <ReviewForm productId={productId} onSubmitted={load} />
          ) : (
            <div className="signin-note">Sign in to write a review.</div>
          )}
        </aside>

        <div className="reviews-main">
          {loading ? <p className="muted">Loading reviews...</p> : error ? <div className="error">{error}</div> : <ReviewList reviews={reviews} />}
        </div>
      </div>
    </section>
  );
}
