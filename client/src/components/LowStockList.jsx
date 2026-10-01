import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ProductImage } from './ProductCard';
import Icon from './Icon';
import Badge from './ui/Badge';
import { ErrorState } from './ui/States';
import useApi from '../hooks/useApi';

// Products at or below the stock threshold (Person B's /analytics/low-stock)
export default function LowStockList({ threshold = 10 }) {
  const { data: items, error, reload } = useApi(() => api.get('/analytics/low-stock', { params: { threshold } }), [threshold], {
    fallback: 'Could not load stock levels',
  });

  if (error && !items) return <ErrorState compact title="Stock levels didn’t load" text={error} onRetry={reload} />;
  if (!items) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[76px] rounded-xl" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
        <Icon name="checkCircle" className="h-5 w-5" /> Every product has more than {threshold} units in stock.
      </p>
    );
  }

  const soldOut = items.filter((p) => p.stock === 0).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="warning" dot>
          {items.length} product{items.length === 1 ? '' : 's'} running low
        </Badge>
        {soldOut > 0 && (
          <Badge tone="danger" dot>
            {soldOut} sold out
          </Badge>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((p, i) => {
          const pct = Math.min(100, (p.stock / threshold) * 100);
          const out = p.stock === 0;
          return (
            <li key={p._id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <Link
                to={`/products/${p._id}`}
                className="group flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lift"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  <ProductImage product={p} className={`h-full w-full group-hover:scale-110 ${out ? 'grayscale' : ''}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">{p.name}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <span className={`block h-full rounded-full ${out ? 'bg-rose-500' : p.stock <= 3 ? 'bg-orange-500' : 'bg-amber-400'}`} style={{ width: `${Math.max(pct, out ? 0 : 6)}%` }} />
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${out ? 'text-rose-600' : 'text-amber-700'}`}>{out ? 'Sold out' : `${p.stock} left`}</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
