import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ProductImage, RatingInline } from './ProductCard';
import Icon from './Icon';
import { IconButton, Spinner } from './ui/Button';
import useAddToCart from '../hooks/useAddToCart';
import useApi from '../hooks/useApi';
import { formatPrice } from '../utils/format';

/** Scroll-snap row with prev / next buttons that enable only when there's more to see */
function useCarousel(deps) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return { ref, edges, scroll };
}

function SuggestionCard({ item, maxCount, index }) {
  const { add, busyId } = useAddToCart();
  const product = { _id: item.productId, name: item.name, price: item.price, category: item.category };
  const busy = busyId === item.productId;
  const strength = Math.round((item.count / maxCount) * 100);

  return (
    <li className="w-56 shrink-0 snap-start animate-fade-up sm:w-60" style={{ animationDelay: `${index * 60}ms` }}>
      <article className="group relative flex h-full flex-col rounded-2xl bg-white p-2 shadow-card ring-1 ring-stone-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
          <ProductImage product={product} className="h-full w-full group-hover:scale-[1.06]" />
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm">
            <Icon name="users" className="h-3 w-3 text-brand-600" />
            {item.count} order{item.count === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-2 pt-3 pb-1.5">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{item.category}</p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900">
            <Link to={`/products/${item.productId}`} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none">
              {item.name}
            </Link>
          </h3>
          <div className="mt-1.5 min-h-4">
            <RatingInline productId={item.productId} size={12} />
          </div>
          {/* How often it was bought together with this product, relative to the top suggestion */}
          <div className="mt-3" title={`Bought together in ${item.count} orders`}>
            <span className="block h-1 overflow-hidden rounded-full bg-stone-200">
              <span className="block h-full rounded-full bg-brand-500 transition-[width] duration-700" style={{ width: `${strength}%` }} />
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="font-semibold text-slate-900 tabular-nums">{formatPrice(item.price)}</span>
            <button
              type="button"
              onClick={() => add(product)}
              disabled={busy}
              aria-label={`Add ${item.name} to cart`}
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-700 transition hover:bg-slate-900 hover:text-white active:scale-95"
            >
              {busy ? <Spinner className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} />}
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}

// <AlsoBoughtStrip productId={id} />   (Person C's GET /products/:id/also-bought)
export default function AlsoBoughtStrip({ productId, limit = 8 }) {
  const { data: items, error } = useApi(() => api.get(`/products/${productId}/also-bought`, { params: { limit } }), [productId, limit]);
  const { ref, edges, scroll } = useCarousel([items]);

  if (error || (items && !items.length)) return null; // nothing useful to show
  const maxCount = items ? Math.max(...items.map((p) => p.count)) : 1;

  return (
    <section aria-labelledby="also-bought-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon name="sparkles" className="h-5 w-5" />
          </span>
          <div>
            <h2 id="also-bought-title" className="text-2xl font-semibold tracking-tight text-slate-900">
              Customers also bought
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Found by analysing past orders that included this product</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <IconButton icon="chevronLeft" label="Previous suggestions" variant="secondary" onClick={() => scroll(-1)} disabled={edges.start} />
          <IconButton icon="chevronRight" label="Next suggestions" variant="secondary" onClick={() => scroll(1)} disabled={edges.end} />
        </div>
      </div>

      <ul ref={ref} className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {!items
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="w-56 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-stone-200/80 sm:w-60" aria-hidden="true">
                <div className="skeleton aspect-square rounded-xl" />
                <div className="space-y-2 p-2 pt-3">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-4 w-12 rounded" />
                </div>
              </li>
            ))
          : items.map((p, i) => <SuggestionCard key={p.productId} item={p} maxCount={maxCount} index={i} />)}
      </ul>
    </section>
  );
}
