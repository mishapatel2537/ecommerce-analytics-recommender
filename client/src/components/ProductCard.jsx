import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { categoryIcon } from './Icon';
import Badge, { stockState } from './ui/Badge';
import { Spinner } from './ui/Button';
import StarRating from './StarRating';
import useAddToCart from '../hooks/useAddToCart';
import useRatingSummary from '../hooks/useRatingSummary';
import { productImage } from '../utils/productImage';
import { formatPrice } from '../utils/format';

/** Product photo that fades in when loaded, with a quiet category placeholder if missing */
// Opacity (load fade) and transform (hover zoom) both animate; set inline so callers' classes don't fight
// (Tailwind v4's scale-* classes use the `scale` property, so it is listed too.)
const IMG_TRANSITION = 'opacity 500ms ease-out, transform 700ms cubic-bezier(0.22, 1, 0.36, 1), scale 700ms cubic-bezier(0.22, 1, 0.36, 1)';

export function ProductImage({ product, className = '', eager = false, style }) {
  const [state, setState] = useState('loading'); // loading | loaded | failed

  if (state === 'failed') {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${className}`} role="img" aria-label={product.name}>
        <Icon name={categoryIcon(product.category)} className="h-1/4 max-h-10 w-1/4 max-w-10" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <img
      src={productImage(product)}
      alt={product.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setState('loaded')}
      onError={() => setState('failed')}
      className={`object-cover ${state === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ transition: IMG_TRANSITION, ...style }}
    />
  );
}

/** Stars + average + count, from the review summary endpoint */
export function RatingInline({ productId, size = 13 }) {
  const summary = useRatingSummary(productId);
  if (!summary) return <span className="skeleton block h-3.5 w-24 rounded" />;
  if (!summary.count) return <span className="text-xs text-slate-400">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <StarRating value={summary.avgRating} size={size} />
      <span className="font-semibold text-slate-700 tabular-nums">{summary.avgRating.toFixed(1)}</span>
      <span className="tabular-nums">({summary.count})</span>
    </span>
  );
}

function TopRatedBadge({ productId }) {
  const s = useRatingSummary(productId);
  if (!s || s.count < 3 || s.avgRating < 4.5) return null;
  return (
    <Badge tone="white" className="animate-fade-in">
      <Icon name="star" className="h-3 w-3 fill-amber-400 text-amber-400" /> Top rated
    </Badge>
  );
}

export default function ProductCard({ product }) {
  const { add, busyId } = useAddToCart();
  const busy = busyId === product._id;
  const stock = stockState(product.stock);
  const soldOut = product.stock <= 0;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl bg-white p-2 shadow-card ring-1 ring-stone-200/80 transition duration-300 ease-[var(--ease-snappy)] hover:-translate-y-1 hover:shadow-lift hover:ring-stone-300/80">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
        <ProductImage
          product={product}
          className={`h-full w-full transition duration-700 ease-[var(--ease-snappy)] group-hover:scale-[1.06] ${soldOut ? 'grayscale-[60%]' : ''}`}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {product.stock < 10 && (
            <Badge tone={soldOut ? 'dark' : 'white'} dot={!soldOut}>
              {stock.short}
            </Badge>
          )}
          <TopRatedBadge productId={product._id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pt-3.5 pb-1.5">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{product.category}</p>
        <h3 className="mt-1 line-clamp-1 text-[15px] font-semibold text-slate-900">
          {/* Stretched link: the whole card opens the product, the add button stays separate */}
          <Link to={`/products/${product._id}`} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-500">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 min-h-4">
          <RatingInline productId={product._id} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">{formatPrice(product.price)}</span>
          <button
            type="button"
            onClick={() => add(product)}
            disabled={soldOut || busy}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
            title={soldOut ? 'Sold out' : 'Add to cart'}
            className="relative z-10 flex h-10 items-center gap-1.5 rounded-xl bg-stone-100 px-3 text-sm font-semibold text-slate-800 transition duration-200 hover:bg-slate-900 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-slate-400 group-hover:bg-slate-900 group-hover:text-white disabled:group-hover:bg-stone-100 disabled:group-hover:text-slate-400"
          >
            {busy ? <Spinner className="h-4 w-4" /> : <Icon name={soldOut ? 'close' : 'plus'} className="h-4 w-4" strokeWidth={2.25} />}
            <span className="hidden sm:inline">{soldOut ? 'Sold out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-2 shadow-card ring-1 ring-stone-200/80" aria-hidden="true">
      <div className="skeleton aspect-[4/3] rounded-xl" />
      <div className="space-y-2.5 px-2 pt-4 pb-2">
        <div className="skeleton h-2.5 w-16 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
        <div className="flex items-center justify-between pt-3">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-10 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
