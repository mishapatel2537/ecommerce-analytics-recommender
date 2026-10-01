import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios'; // from Person A
import { ProductImage } from './ProductCard';
import Icon from './Icon';
import SegmentedControl from './ui/SegmentedControl';
import { EmptyState, ErrorState } from './ui/States';
import useApi from '../hooks/useApi';
import { formatPrice, formatPriceRounded } from '../utils/format';

const integer = new Intl.NumberFormat('en-US');

const METRICS = {
  quantity: { key: 'totalQuantity', other: 'totalRevenue', label: 'units', format: (v) => integer.format(v), otherFormat: (v) => formatPriceRounded(v) },
  revenue: { key: 'totalRevenue', other: 'totalQuantity', label: 'revenue', format: (v) => formatPriceRounded(v), otherFormat: (v) => `${integer.format(v)} units` },
};

const RANK_STYLES = ['bg-amber-100 text-amber-800 ring-amber-200', 'bg-stone-200 text-stone-700 ring-stone-300', 'bg-orange-100 text-orange-800 ring-orange-200'];

function Row({ item, rank, max, metric, grow }) {
  const m = METRICS[metric];
  const pct = max ? (item[m.key] / max) * 100 : 0;
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${rank * 45}ms` }}>
      <Link
        to={`/products/${item.productId}`}
        className="group grid grid-cols-[1.75rem_2.75rem_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-stone-50"
        title={`${item.name}: ${integer.format(item.totalQuantity)} units · ${formatPrice(item.totalRevenue)} · ${item.orders} orders`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums ring-1 ${
            RANK_STYLES[rank] || 'bg-white text-slate-500 ring-stone-200'
          }`}
        >
          {rank + 1}
        </span>
        <span className="h-11 w-11 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/70">
          <ProductImage product={item} className="h-full w-full group-hover:scale-110" />
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">{item.name}</span>
          </span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-stone-100">
            <span
              className={`block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-snappy)] ${rank === 0 ? 'bg-brand-600' : 'bg-brand-400 group-hover:bg-brand-500'}`}
              style={{ width: grow ? `${Math.max(pct, 2)}%` : '0%' }}
            />
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            {item.category} · {item.orders} orders
          </span>
        </span>
        <span className="text-right tabular-nums">
          <span className="block text-sm font-semibold text-slate-900">{m.format(item[m.key])}</span>
          <span className="block text-xs text-slate-400">{m.otherFormat(item[m.other])}</span>
        </span>
      </Link>
    </li>
  );
}

/** Best-selling products (Person B's /analytics/top-products). from / to: 'YYYY-MM-DD' or '' */
export default function TopProductsChart({ from, to, limit = 7 }) {
  const [sortBy, setSortBy] = useState('quantity');
  const [grow, setGrow] = useState(false);
  const { data, error, loading, reload } = useApi(
    () => api.get('/analytics/top-products', { params: { sortBy, limit, from: from || undefined, to: to || undefined } }),
    [sortBy, from, to, limit],
    { fallback: 'Could not load top products' }
  );

  // Bars grow in after each load
  useEffect(() => {
    setGrow(false);
    if (!data) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrow(true)));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const m = METRICS[sortBy];
  const max = data?.length ? Math.max(...data.map((d) => d[m.key])) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Ranked by {m.label}</p>
        <SegmentedControl
          size="sm"
          label="Rank by"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'quantity', label: 'Units' },
            { value: 'revenue', label: 'Revenue' },
          ]}
        />
      </div>

      <div className={`transition-opacity duration-200 ${loading && data ? 'opacity-50' : ''}`} aria-busy={loading}>
        {error && !data ? (
          <ErrorState compact title="Top products didn’t load" text={error} onRetry={reload} />
        ) : !data ? (
          <ul className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2">
                <div className="skeleton h-7 w-7 rounded-lg" />
                <div className="skeleton h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-1/2 rounded" />
                  <div className="skeleton h-2 w-full rounded-full" />
                </div>
                <div className="skeleton h-4 w-12 rounded" />
              </li>
            ))}
          </ul>
        ) : data.length === 0 ? (
          <EmptyState compact icon="chart" title="No sales in this period" text="Try a wider date range." />
        ) : (
          <ol className="-mx-2 space-y-0.5" aria-label={`Top ${data.length} products by ${m.label}`}>
            {data.map((item, i) => (
              <Row key={item.productId} item={item} rank={i} max={max} metric={sortBy} grow={grow} />
            ))}
          </ol>
        )}
      </div>
      {data?.length > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Icon name="info" className="h-3.5 w-3.5" /> Cancelled orders are not counted. Select a product to open its page.
        </p>
      )}
    </div>
  );
}
