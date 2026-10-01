import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartSummary from '../components/CartSummary';
import CheckoutSteps from '../components/CheckoutSteps';
import { ProductImage } from '../components/ProductCard';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Brand';
import PageHeader from '../components/ui/PageHeader';
import { EmptyState, InlineError } from '../components/ui/States';
import { useToast } from '../components/Toast';
import api, { errorMessage } from '../api/axios'; // from Person A
import { formatDate, formatPrice } from '../utils/format';

function Section({ step, title, action, children }) {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-semibold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-slate-600">{step}</span>
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Shown after the order is placed (the cart is empty by then) */
function OrderPlaced({ order }) {
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={2} />
      <div className="mt-10 animate-scale-in overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-lift">
        <div className="border-b border-stone-100 px-6 py-10 text-center sm:px-10">
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-50 [animation-iteration-count:2] motion-reduce:hidden" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Icon name="check" className="h-8 w-8" strokeWidth={2.5} />
            </span>
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Order placed</h1>
          <p className="mt-2 text-slate-500">Thanks! Your order has been recorded and stock has been updated.</p>
          <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 rounded-2xl bg-stone-50 p-4 text-left ring-1 ring-stone-200/70">
            <div>
              <dt className="text-xs text-slate-500">Order</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-900">#{order._id.slice(-6).toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Date</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{formatDate(order.orderDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <StatusBadge status={order.status} />
              </dd>
            </div>
          </dl>
        </div>

        <ul className="divide-y divide-stone-100 px-6 sm:px-10">
          {order.items.map((it) => (
            <li key={it.product} className="flex items-center gap-4 py-4">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/70">
                <ProductImage product={it} className="h-full w-full" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{it.name}</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {it.quantity} × {formatPrice(it.price)}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatPrice(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-stone-200 bg-stone-50/60 px-6 py-5 sm:px-10">
          <span className="text-sm text-slate-600">
            Total · {count} item{count === 1 ? '' : 's'}
          </span>
          <span className="text-xl font-semibold text-slate-900 tabular-nums">{formatPrice(order.total)}</span>
        </div>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button to="/orders" state={{ placedOrderId: order._id }} size="lg" icon="cube">
          View my orders
        </Button>
        <Button to="/shop" variant="secondary" size="lg">
          Continue shopping
        </Button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, fetchCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  const placeOrder = async () => {
    try {
      setPlacing(true);
      setError('');
      const { data: order } = await api.post('/orders/checkout');
      setPlaced(order);
      await fetchCart(); // cart is now empty
      toast({ title: 'Order placed', text: `Total ${formatPrice(order.total)}` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err, 'Checkout failed. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  if (placed) return <OrderPlaced order={placed} />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon="cart"
          title="Nothing to check out"
          text="Your cart is empty. Add a few products first."
          action={
            <Button to="/shop" iconRight="arrowRight">
              Browse products
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={1} />
      <PageHeader className="mt-8" title="Checkout" description="Check your details and items, then place your order." />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="space-y-5">
          <Section step={1} title="Customer">
            <div className="flex items-center gap-3.5 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
              <Avatar name={user?.name || ''} className="h-11 w-11 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-sm text-slate-500">{user?.email}</p>
              </div>
              <Icon name="checkCircle" className="ml-auto h-5 w-5 text-emerald-500" />
            </div>
          </Section>

          <Section
            step={2}
            title="Items"
            action={
              <Button to="/cart" variant="ghost" size="sm" icon="pencil">
                Edit cart
              </Button>
            }
          >
            <ul className="divide-y divide-stone-100">
              {items.map((i) => (
                <li key={i.productId._id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200/70">
                    <ProductImage product={i.productId} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{i.productId.name}</p>
                    <p className="text-sm text-slate-500 tabular-nums">
                      {i.quantity} × {formatPrice(i.productId.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatPrice(i.productId.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section step={3} title="Payment">
            <div className="flex items-start gap-3 rounded-xl bg-brand-50/60 p-4 text-sm text-slate-700 ring-1 ring-brand-100">
              <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p>
                <span className="font-semibold text-slate-900">No payment needed.</span> This is a demo store: placing the order records it and
                updates stock, but no money is taken.
              </p>
            </div>
          </Section>
        </div>

        <div>
          <CartSummary items={items}>
            {error && (
              <div className="mb-4">
                <InlineError>{error}</InlineError>
              </div>
            )}
            <Button size="lg" block onClick={placeOrder} loading={placing} icon={placing ? undefined : 'check'}>
              {placing ? 'Placing order…' : 'Place order'}
            </Button>
          </CartSummary>
        </div>
      </div>
    </div>
  );
}
