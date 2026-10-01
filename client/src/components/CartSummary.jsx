import Icon from './Icon';
import { formatPrice } from '../utils/format';

/** Order summary card. `items` are cart items ({ productId: product, quantity }). */
export default function CartSummary({ items, children, title = 'Order summary' }) {
  const total = items.reduce((sum, i) => sum + (i.productId?.price || 0) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card lg:sticky lg:top-24">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>
            Subtotal · {count} item{count === 1 ? '' : 's'}
          </dt>
          <dd className="font-medium text-slate-900 tabular-nums">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Shipping</dt>
          <dd className="font-medium text-emerald-700">Free</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-stone-300 pt-4">
          <dt className="text-base font-semibold text-slate-900">Total</dt>
          <dd key={total} className="animate-fade-in text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>
      {children && <div className="mt-6">{children}</div>}
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Icon name="lock" className="h-3.5 w-3.5" /> Demo store: no real payment is taken
      </p>
    </div>
  );
}
