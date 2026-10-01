import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import StarRating from './StarRating';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import Icon from './Icon';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import { EmptyState, ErrorState } from './ui/States';
import { useAuth } from '../context/AuthContext';

const PAGE = 5;
const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  highest: (a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt),
  lowest: (a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt),
};

function ReviewSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-stone-200/80 bg-white p-5">
          <div className="flex gap-3.5">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
          <div className="skeleton mt-4 h-3.5 w-11/12 rounded" />
          <div className="skeleton mt-2 h-3.5 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

// <ReviewSection productId={id} isLoggedIn={!!user} onSummary={(s) => ...} />
export default function ReviewSection({ productId, productName, isLoggedIn, onSummary }) {
  const location = useLocation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, count: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [list, sum] = await Promise.all([api.get(`/products/${productId}/reviews`), api.get(`/products/${productId}/reviews/summary`)]);
      setReviews(list.data);
      setSummary(sum.data);
      onSummary && onSummary(sum.data);
    } catch {
      setError('Reviews couldn’t be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    setStarFilter(0);
    setShown(PAGE);
    load();
  }, [load]);

  const visible = useMemo(() => reviews.filter((r) => !starFilter || r.rating === starFilter).sort(SORTS[sort]), [reviews, starFilter, sort]);
  const alreadyReviewed = user && reviews.some((r) => r.user?._id === user._id);
  const dist = summary.distribution || {};

  const writeButton = isLoggedIn ? (
    alreadyReviewed ? (
      <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
        <Icon name="checkCircle" className="h-4.5 w-4.5" /> You reviewed this
      </span>
    ) : (
      <Button icon="pencil" onClick={() => setFormOpen(true)}>
        Write a review
      </Button>
    )
  ) : (
    <Button variant="secondary" to="/login" state={{ from: location }} icon="user">
      Log in to review
    </Button>
  );

  return (
    <section id="reviews" className="scroll-mt-24" aria-labelledby="reviews-title">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-title" className="text-2xl font-semibold tracking-tight text-slate-900">
            Ratings & reviews
          </h2>
          <p className="mt-1 text-sm text-slate-500">What customers say about this product</p>
        </div>
        {writeButton}
      </div>

      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">{summary.count ? summary.avgRating.toFixed(1) : '–'}</span>
              <div>
                <StarRating value={summary.avgRating} size={18} />
                <p className="mt-1 text-sm text-slate-500">
                  Based on {summary.count} review{summary.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Distribution: click a row to filter */}
            <div className="mt-6 space-y-1" role="group" aria-label="Filter by rating">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = dist[n] || 0;
                const pct = summary.count ? (c / summary.count) * 100 : 0;
                const active = starFilter === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={!c}
                    onClick={() => {
                      setStarFilter(active ? 0 : n);
                      setShown(PAGE);
                    }}
                    aria-pressed={active}
                    aria-label={`${n} star: ${c} review${c === 1 ? '' : 's'}`}
                    className={`grid w-full grid-cols-[2.5rem_1fr_2.25rem] items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition disabled:cursor-default ${
                      active ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-stone-100 disabled:hover:bg-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-medium text-slate-700 tabular-nums">
                      {n} <Icon name="star" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-stone-200">
                      <span className="block h-full rounded-full bg-amber-400 transition-[width] duration-700 ease-[var(--ease-snappy)]" style={{ width: loading ? '0%' : `${pct}%` }} />
                    </span>
                    <span className="text-right text-slate-500 tabular-nums">{c}</span>
                  </button>
                );
              })}
            </div>
            {summary.count > 0 && <p className="mt-4 text-xs text-slate-400">Tip: click a row to see only those reviews.</p>}
          </div>
        </aside>

        {/* List */}
        <div className="min-w-0">
          {reviews.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500" aria-live="polite">
                {starFilter ? (
                  <>
                    Showing {visible.length} {starFilter}-star review{visible.length === 1 ? '' : 's'} ·{' '}
                    <button type="button" onClick={() => setStarFilter(0)} className="font-semibold text-brand-700 hover:text-brand-900">
                      Show all
                    </button>
                  </>
                ) : (
                  `${reviews.length} review${reviews.length === 1 ? '' : 's'}`
                )}
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-500">
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="field field-select h-9 w-auto py-0 font-medium">
                  <option value="newest">Newest</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
              </label>
            </div>
          )}

          {loading ? (
            <ReviewSkeleton />
          ) : error ? (
            <ErrorState compact title={error} onRetry={load} className="rounded-2xl border border-rose-200 bg-rose-50/50" />
          ) : reviews.length === 0 ? (
            <EmptyState icon="chat" title="Be the first to share your experience" text="Your review helps other customers choose with confidence." action={writeButton} />
          ) : (
            <>
              <ReviewList reviews={visible.slice(0, shown)} currentUserId={user?._id} />
              {visible.length > shown && (
                <Button variant="secondary" block className="mt-4" icon="chevronDown" onClick={() => setShown((s) => s + PAGE)}>
                  Show more reviews ({visible.length - shown} more)
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Write a review" description="Reviews are public and show your name.">
        <ReviewForm
          productId={productId}
          productName={productName}
          onCancel={() => setFormOpen(false)}
          onSubmitted={() => {
            setFormOpen(false);
            load();
          }}
        />
      </Dialog>
    </section>
  );
}
