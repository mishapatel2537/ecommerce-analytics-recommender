import { useEffect, useState } from 'react';
import api from '../api/axios';

// Products carry no rating field, so cards read Person C's
// GET /products/:id/reviews/summary. Results are cached for the session
// and shared between cards, so each product is fetched once.
const cache = new Map(); // productId -> Promise<summary>

export function loadRatingSummary(productId) {
  if (!cache.has(productId)) {
    cache.set(
      productId,
      api
        .get(`/products/${productId}/reviews/summary`)
        .then((r) => r.data)
        .catch(() => {
          cache.delete(productId); // let a later render try again
          return null;
        })
    );
  }
  return cache.get(productId);
}

/** Forget a product's cached summary (after posting a review) */
export function invalidateRatingSummary(productId) {
  cache.delete(productId);
}

export default function useRatingSummary(productId) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    loadRatingSummary(productId).then((s) => !cancelled && setSummary(s));
    return () => {
      cancelled = true;
    };
  }, [productId]);
  return summary;
}
