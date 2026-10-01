import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OrderRow, { OrderRowSkeleton } from '../components/OrderRow';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import { EmptyState, ErrorState } from '../components/ui/States';
import api from '../api/axios'; // from Person A
import useApi from '../hooks/useApi';
import { formatPrice } from '../utils/format';

const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-slate-600">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const location = useLocation();
  const placedOrderId = location.state?.placedOrderId;
  const { data: orders, error, loading, reload } = useApi(() => api.get('/orders'), [], { fallback: 'Could not load your orders' });
  const [status, setStatus] = useState('all');

  // All figures below come from this customer's own orders
  const stats = useMemo(() => {
    if (!orders) return null;
    const live = orders.filter((o) => o.status !== 'cancelled');
    return {
      count: orders.length,
      spent: live.reduce((s, o) => s + o.total, 0),
      items: live.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
    };
  }, [orders]);

  const statusOptions = useMemo(() => {
    if (!orders) return [];
    const present = STATUS_ORDER.filter((s) => orders.some((o) => o.status === s));
    return [{ value: 'all', label: `All ${orders.length}` }].concat(
      present.map((s) => ({ value: s, label: `${s[0].toUpperCase()}${s.slice(1)} ${orders.filter((o) => o.status === s).length}` }))
    );
  }, [orders]);

  const visible = orders ? orders.filter((o) => status === 'all' || o.status === status) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader title="My orders" description="Track what you’ve ordered. Select an order to see its items and progress." />

      {loading && !orders ? (
        <div className="mt-8 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-[74px] rounded-2xl" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : error && !orders ? (
        <ErrorState className="mt-8" title="We couldn’t load your orders" text={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="cube"
          title="No orders yet"
          text="When you place an order it will show up here with its status."
          action={
            <Button to="/shop" iconRight="arrowRight">
              Start shopping
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-8 grid animate-fade-up gap-3 sm:grid-cols-3">
            <Stat icon="receipt" label="Orders" value={stats.count} />
            <Stat icon="dollar" label="Total spent" value={formatPrice(stats.spent)} />
            <Stat icon="cube" label="Items bought" value={stats.items} />
          </div>
          <p className="mt-2 text-xs text-slate-400">Totals leave out cancelled orders.</p>

          {statusOptions.length > 2 && (
            <div className="scrollbar-none -mx-4 mt-8 overflow-x-auto px-4">
              <SegmentedControl label="Filter by status" value={status} onChange={setStatus} options={statusOptions} />
            </div>
          )}

          <ul className="mt-5 space-y-3">
            {visible.map((o, i) => (
              <OrderRow key={o._id} order={o} index={i} highlight={o._id === placedOrderId} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
