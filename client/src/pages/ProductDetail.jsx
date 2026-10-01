import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // from Person A
import { ProductImage } from '../components/ProductCard';
import StarRating from '../components/StarRating';
import ReviewSection from '../components/ReviewSection'; // Person C
import AlsoBoughtStrip from '../components/AlsoBoughtStrip'; // Person C
import Icon, { categoryIcon } from '../components/Icon';
import Badge, { stockState } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import QuantityStepper from '../components/ui/QuantityStepper';
import { Breadcrumbs } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/States';
import useAddToCart from '../hooks/useAddToCart';
import useApi from '../hooks/useApi';
import { formatDate, formatPrice } from '../utils/format';

/** Photo that zooms toward the cursor on hover (mouse only) */
function ZoomImage({ product }) {
  const [origin, setOrigin] = useState('50% 50%');
  const [zoom, setZoom] = useState(false);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div
      className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-stone-100 shadow-card ring-1 ring-stone-200/70"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setZoom(true)}
      onPointerLeave={() => setZoom(false)}
      onPointerMove={onMove}
    >
      <ProductImage
        product={product}
        eager
        className="h-full w-full"
        style={{ transformOrigin: origin, transform: zoom ? 'scale(1.7)' : 'none', transition: 'opacity 500ms ease-out, transform 300ms ease-out' }}
      />
      <span
        className={`pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition-opacity duration-300 max-md:hidden ${
          zoom ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Icon name="search" className="h-3.5 w-3.5" /> Hover to zoom
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-hidden="true">
      <div className="skeleton h-4 w-56 rounded" />
      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-5 pt-2">
          <div className="skeleton h-6 w-28 rounded-full" />
          <div className="skeleton h-10 w-4/5 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton mt-8 h-12 w-full rounded-xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add, busyId } = useAddToCart();
  const [qty, setQty] = useState(1);
  const [summary, setSummary] = useState({ avgRating: 0, count: 0 });
  const [showBar, setShowBar] = useState(false);
  const buyRef = useRef(null);

  const { data, loading, error, reload } = useApi(() => api.get(`/products/${id}`), [id], { fallback: 'Could not load this product' });
  const product = data?.product?._id === id ? data.product : null;

  useEffect(() => {
    setQty(1);
    setSummary({ avgRating: 0, count: 0 });
  }, [id]);

  // Mobile: show a sticky add-to-cart bar once the main buttons scroll away
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  if (loading && !product) return <DetailSkeleton />;

  if (!product) {
    const notFound = /not found|invalid/i.test(error || '');
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={notFound ? 'search' : 'alert'}
          title={notFound ? 'We couldn’t find that product' : 'This product didn’t load'}
          text={notFound ? 'It may have been removed. Have a look at the rest of the shop.' : error}
          action={
            <>
              {!notFound && (
                <Button variant="secondary" icon="refresh" onClick={reload}>
                  Try again
                </Button>
              )}
              <Button to="/shop" icon="arrowLeft">
                Back to shop
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const stock = stockState(product.stock);
  const inStock = product.stock > 0;
  const adding = busyId === product._id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Shop', to: '/shop' },
          { label: product.category, to: `/shop?category=${encodeURIComponent(product.category)}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up">
          <ZoomImage product={product} />
        </div>

        <div className="animate-fade-up [animation-delay:80ms] md:sticky md:top-24 md:self-start">
          <Badge tone="neutral" className="py-1">
            <Icon name={categoryIcon(product.category)} className="h-3.5 w-3.5" />
            {product.category}
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">{product.name}</h1>

          <a href="#reviews" className="group mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
            <StarRating value={summary.avgRating} size={16} />
            {summary.count ? (
              <>
                <span className="font-semibold text-slate-900 tabular-nums">{summary.avgRating.toFixed(1)}</span>
                <span className="underline decoration-stone-300 underline-offset-4 transition group-hover:decoration-slate-600">
                  {summary.count} review{summary.count === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="underline decoration-stone-300 underline-offset-4 group-hover:decoration-slate-600">No reviews yet</span>
            )}
          </a>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">{formatPrice(product.price)}</p>
            <Badge tone={stock.tone} dot>
              {stock.label}
            </Badge>
          </div>

          <div ref={buyRef} className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} max={Math.max(1, product.stock)} onChange={setQty} busy={false} />
              <Button size="lg" icon="cart" className="flex-1" onClick={() => add(product, qty)} loading={adding} disabled={!inStock}>
                {inStock ? (adding ? 'Adding…' : 'Add to cart') : 'Sold out'}
              </Button>
            </div>
            <Button size="lg" variant="secondary" block className="mt-3" onClick={() => add(product, qty, { thenCart: true })} disabled={!inStock || adding}>
              Buy now
            </Button>
            {!user && <p className="mt-3 text-center text-xs text-slate-500">You’ll be asked to log in first.</p>}
          </div>

          <ul className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <Perk icon="truck" title="Free shipping" text="On every order" />
            <Perk icon="shield" title="Demo checkout" text="No real payment is taken" />
          </ul>

          <dl className="mt-8 divide-y divide-stone-200 border-y border-stone-200 text-sm">
            <Detail label="Category" value={product.category} />
            <Detail label="Availability" value={inStock ? `${product.stock} units in stock` : 'Out of stock'} />
            {product.createdAt && <Detail label="Listed" value={formatDate(product.createdAt)} />}
          </dl>
        </div>
      </div>

      {/* Person C */}
      <div className="mt-20">
        <AlsoBoughtStrip productId={product._id} />
      </div>
      <div className="mt-20 border-t border-stone-200 pt-14">
        <ReviewSection key={product._id} productId={product._id} productName={product.name} isLoggedIn={!!user} onSummary={setSummary} />
      </div>

      {/* Mobile sticky purchase bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(28_25_23/0.18)] backdrop-blur transition-transform duration-300 md:hidden ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showBar}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
            <p className="text-sm text-slate-500 tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <Button icon="cart" onClick={() => add(product, qty)} loading={adding} disabled={!inStock} tabIndex={showBar ? 0 : -1}>
            {inStock ? 'Add' : 'Sold out'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Perk({ icon, title, text }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-stone-100/70 px-3.5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-card">
        <Icon name={icon} className="h-4.5 w-4.5" />
      </span>
      <span>
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </li>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
