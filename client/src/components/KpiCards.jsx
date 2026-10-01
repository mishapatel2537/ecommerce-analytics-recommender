import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import Icon from './Icon';
import AnimatedNumber from './ui/AnimatedNumber';
import { SERIES, currency, currency0, integer, isPartial } from './SalesTrendChart';

function Delta({ current, previous, partial }) {
  if (previous == null || current == null) return <span className="text-xs text-slate-400">No earlier period to compare</span>;
  if (partial || !previous) return <span className="text-xs text-slate-400">Not enough history to compare</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
      >
        <Icon name={up ? 'trendingUp' : 'trendingDown'} className="h-3.5 w-3.5" strokeWidth={2.25} />
        {up ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
      <span className="text-slate-400">vs previous period</span>
    </span>
  );
}

function Sparkline({ rows, dataKey }) {
  const id = useId().replace(/:/g, '');
  if (rows.length < 2) return null;
  return (
    <div className="h-12 w-24 shrink-0 opacity-90 transition-opacity group-hover:opacity-100" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.16} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={SERIES} strokeWidth={1.75} fill={`url(#spark-${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon, label, value, format, sub, spark, ready, index }) {
  return (
    <div
      className="group flex min-w-0 animate-fade-up flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-600 ring-1 ring-stone-200/80 transition group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:ring-brand-100">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        {ready ? (
          <div className="min-w-0 truncate text-2xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[1.7rem]">
            {typeof value === 'number' ? <AnimatedNumber value={value} format={format} /> : value}
          </div>
        ) : (
          <div className="skeleton h-8 w-28 rounded-lg" />
        )}
        {ready && spark}
      </div>
      <div className="mt-2.5 min-h-5">{ready ? sub : <div className="skeleton h-4 w-36 rounded" />}</div>
    </div>
  );
}

/**
 * Top row of the dashboard.
 * trend    = useSalesTrend(from, to)           (Person A's sales-trend endpoint)
 * segments = data from /analytics/segments     (Person C), for active customers
 */
export default function KpiCards({ trend, segments }) {
  const { current, previous, rows, loading } = trend;
  const t = current?.totals;
  const p = previous?.totals;
  const aov = t?.orders ? t.revenue / t.orders : 0;
  const prevAov = p ? (p.orders ? p.revenue / p.orders : 0) : null;
  const partial = isPartial(previous, trend.previousFrom);
  const customers = segments ? segments.reduce((s, d) => s + d.customers, 0) : null;
  const best = rows.reduce((b, r) => (!b || r.revenue > b.revenue ? r : b), null);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div id="overview" className={`grid scroll-mt-36 grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:scroll-mt-24 xl:grid-cols-4 lg:col-span-2 ${loading && t ? 'opacity-60' : ''}`}>
      <KpiCard
        index={0}
        icon="dollar"
        label="Total revenue"
        ready={!!t}
        value={t?.revenue}
        format={(n) => currency0.format(n)}
        sub={<Delta current={t?.revenue} previous={p?.revenue} partial={partial} />}
        spark={<Sparkline rows={rows} dataKey="revenue" />}
      />
      <KpiCard
        index={1}
        icon="receipt"
        label="Orders"
        ready={!!t}
        value={t?.orders}
        format={(n) => integer.format(Math.round(n))}
        sub={<Delta current={t?.orders} previous={p?.orders} partial={partial} />}
        spark={<Sparkline rows={rows} dataKey="orders" />}
      />
      <KpiCard
        index={2}
        icon="cart"
        label="Avg order value"
        ready={!!t}
        value={t?.orders ? aov : '–'}
        format={(n) => currency.format(n)}
        sub={<Delta current={aov} previous={prevAov} partial={partial} />}
        spark={<Sparkline rows={rows} dataKey="aov" />}
      />
      <KpiCard
        index={3}
        icon="users"
        label="Active customers"
        ready={customers != null && !!t}
        value={customers ?? 0}
        format={(n) => integer.format(Math.round(n))}
        sub={
          best && best.revenue > 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon name="trophy" className="h-3.5 w-3.5 text-amber-500" />
              Best month {months[best.month - 1]} {best.year} · {currency0.format(best.revenue)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Customers with an order in this period</span>
          )
        }
      />
    </div>
  );
}
