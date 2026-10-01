import { useState } from 'react';
import api from '../api/axios.js';
import StarRating from './StarRating.jsx';

export default function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!rating) return setError('Please choose a star rating.');
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      setRating(0);
      setComment('');
      onSubmitted && onSubmitted();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('You have already reviewed this product.');
      else if (status === 401) setError('Please sign in to leave a review.');
      else setError(err.response?.data?.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form">
      <h3>Write a review</h3>
      <StarRating value={rating} onChange={setRating} size={30} />
      <textarea
        rows={4}
        maxLength={1000}
        placeholder="What did you like or dislike? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <div className="error">{error}</div>}
      <button className="btn" onClick={submit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>
    </div>
  );
}
