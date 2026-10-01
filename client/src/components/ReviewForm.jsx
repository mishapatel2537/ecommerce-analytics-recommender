import { useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';
import Button from './ui/Button';
import { TextArea } from './ui/Field';
import { useToast } from './Toast';
import { invalidateRatingSummary } from '../hooks/useRatingSummary';

const MAX = 1000;

/** Review form (rendered inside a dialog by ReviewSection). Posts to Person C's review API. */
export default function ReviewForm({ productId, productName, onSubmitted, onCancel }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setRatingError('Choose a star rating to continue.');
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      invalidateRatingSummary(productId);
      toast({ title: 'Review posted', text: 'Thanks for sharing your experience.' });
      onSubmitted?.();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('You have already reviewed this product.');
      else if (status === 401) setError('Please log in to leave a review.');
      else setError(err.response?.data?.message || 'Could not submit your review. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-6 px-5 py-6 sm:px-6">
        {productName && <p className="text-sm text-slate-500">How would you rate {productName}?</p>}
        <div>
          <span id="rating-label" className="mb-2 block text-sm font-medium text-slate-700">
            Your rating
          </span>
          <StarRating
            value={rating}
            onChange={(r) => {
              setRating(r);
              setRatingError('');
            }}
            size={32}
            labelledBy="rating-label"
          />
          {ratingError && <p className="mt-2 text-xs font-medium text-rose-600">{ratingError}</p>}
        </div>
        <TextArea
          label="Your review"
          optional
          rows={4}
          maxLength={MAX}
          placeholder="What did you like or dislike? How did you use it?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3 border-t border-stone-200/80 bg-stone-50/60 px-5 py-4 sm:px-6">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Posting…' : 'Post review'}
        </Button>
      </div>
    </form>
  );
}
