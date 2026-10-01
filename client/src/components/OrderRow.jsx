import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImage } from './ProductCard';
import Icon from './Icon';
import Badge, { StatusBadge } from './ui/Badge';
import { formatDate, formatPrice } from '../utils/format';

// Order lifecycle from the shared schema (cancelled is shown separately)
const FLOW = [
  { key: 'pending', label: 'Placed', icon: 'receipt' },
  { key: 'paid', label: 'Paid', icon: 'checkCircle' },
  { key: 'shipped', label: 'Shipped', icon: 'truck' },
  { key: 'delivered', label: 'Delivered', icon: 'cube' },
];

function Progress({ status }) {
  if (status === 'cancelled') {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-sm text-slate-600">
        <Icon name="xCircle" className="h-5 w-5 text-slate-400" /> This order was cancelled.
      </p>
    );
  }
  const at = Math.max(0, FLOW.findIndex((s) => s.key === status));
  return (
    <ol className="grid grid-cols-4" aria-label={`Order status: ${status}`}>
      {FLOW.map((s, i) => {
        const reached = i <= at;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center" aria-current={i === at ? 'step' : undefined}>
            {i > 0 && (
              <span className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${i <= at ? 'bg-emerald-500' : 'bg-stone-200'}`} aria-hidden="true" />
            )}
            <span
              className={`relative flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white transition ${
                reached ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-slate-400'
              }`}
            >
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <span className={`mt-2 text-xs font-medium ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderRow({ order, highlight = false, index = 0 }) {
  const [open, setOpen] = useState(highlight);
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  const panelId = `order-${order._id}`;

  return (
    <li
      className={`animate-fade-up overflow-hidden rounded-2xl border bg-white shadow-card transition ${
        highlight ? 'border-emerald-300 ring-4 ring-emerald-100' : 'border-stone-200/80 hover:border-stone-300'
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 p-4 text-left transition hover:bg-stone-50/70 sm:flex-nowrap sm:p-5"
      >
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((it, idx) => (
            <span key={idx} className="h-12 w-12 overflow-hidden rounded-xl bg-stone-100 ring-2 ring-white">
              <ProductImage product={it} className="h-full w-full" />
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-slate-600 ring-2 ring-white">
              +{order.items.length - 3}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            Order <span className="font-mono">#{order._id.slice(-6).toUpperCase()}</span>
            {highlight && <Badge tone="success">Just placed</Badge>}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatDate(order.orderDate)} · {count} item{count === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <StatusBadge status={order.status} />
          <span className="min-w-24 text-right text-base font-semibold text-slate-900 tabular-nums">{formatPrice(order.total)}</span>
          <Icon name="chevronDown" className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Smooth height animation via grid rows */}
      <div id={panelId} className={`grid transition-[grid-template-rows] duration-300 ease-[var(--ease-snappy)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden" inert={open ? undefined : ''}>
          <div className="space-y-6 border-t border-stone-100 bg-stone-50/50 px-4 py-6 sm:px-6">
            <Progress status={order.status} />
            <ul className="divide-y divide-stone-200/70 rounded-xl border border-stone-200/70 bg-white px-4">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    <ProductImage product={it} className="h-full w-full" />
                  </span>
                  <Link to={`/products/${it.product}`} className="min-w-0 flex-1 truncate font-medium text-slate-700 transition hover:text-brand-700">
                    {it.name}
                  </Link>
                  <span className="shrink-0 text-slate-500 tabular-nums">
                    {it.quantity} × {formatPrice(it.price)}
                  </span>
                  <span className="w-20 shrink-0 text-right font-semibold text-slate-900 tabular-nums">{formatPrice(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-stone-200/80 bg-white p-5" aria-hidden="true">
      <div className="flex -space-x-3">
        <div className="skeleton h-12 w-12 rounded-xl ring-2 ring-white" />
        <div className="skeleton h-12 w-12 rounded-xl ring-2 ring-white" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3.5 w-44 rounded" />
      </div>
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-5 w-16 rounded" />
    </div>
  );
}
