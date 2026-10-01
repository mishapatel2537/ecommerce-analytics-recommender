import { useEffect, useId, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errorMessage } from '../api/axios';
import { SegmentedControl } from './DashboardLayout';
import Icon from './Icon';

// Chart tokens: one brand series + recessive grid / axis ink
const SERIES = '#4f46e5';
const GRID = '#eef2f7';
const AXIS_INK = '#64748b';
const SURFACE = '#ffffff';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 24 * 60 * 60 * 1000;

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const currency0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en-US');

const METRICS = {
  revenue: { label: 'Revenue', format: (v) => currency.format(v), tick: (v) => compactCurrency.format(v) },
  orders: { label: 'Orders', format: (v) => integer.format(v), tick: (v) => integer.format(v) },
};

// "2026-03" -> "Mar '26"
const shortPeriod = (period) => `${MONTHS[Number(period.slice(5, 7)) - 1]} '${period.slice(2, 4)}`;
const longMonth = (row) => `${MONTHS[row.month - 1]} ${row.year}`;
const toISODate = (d) => d.toISOString().slice(0, 10);

// API only returns months that had orders; fill the gaps with zeros so the line is honest
function fillMonths(rows, from, to) {
  const byPeriod = new Map(rows.map((r) => [r.period, r]));
  const startSrc = from || rows[0]?.period;
  if (!startSrc) return [];
  const endSrc = to || new Date().toISOString().slice(0, 7);

  let [y, m] = startSrc.slice(0, 7).split('-').map(Number);
  const [endY, endM] = endSrc.slice(0, 7).split('-').map(Number);

  const out = [];
  while (y < endY || (y === endY && m <= endM)) {
    const period = `${y}-${String(m).padStart(2, '0')}`;
    const row = byPeriod.get(period) || { period, year: y, month: m, revenue: 0, orders: 0, units: 0 };
    out.push({ ...row, aov: row.orders ? row.revenue / row.orders : 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

// The same-length window just before [from, to].
// Month-aligned ranges (the presets) compare whole calendar months, e.g. 6M Apr–Sep vs Oct–Mar.
function previousRange(from, to) {
  if (!from || !to) return null;
  const start = new Date(from);
  const end = new Date(to);
  const prevEnd = new Date(start.getTime() - DAY);

  if (from.endsWith('-01')) {
    const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth()) + 1;
    const prevStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - months, 1));
    return { from: toISODate(prevStart), to: toISODate(prevEnd) };
  }

  const prevStart = new Date(prevEnd.getTime() - (end - start));
  return { from: toISODate(prevStart), to: toISODate(prevEnd) };
}

/**
 * Fetches the sales trend for [from, to] and the previous period of the same length.
 * Keeps the last result while refetching so the UI doesn't flash.
 */
export function useSalesTrend(from, to) {
  const [state, setState] = useState({ current: null, previous: null, loading: true, error: '' });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));

    const prev = previousRange(from, to);
    const get = (range) =>
      api.get('/analytics/sales-trend', { params: { from: range.from || undefined, to: range.to || undefined } }).then((r) => r.data);

    Promise.all([get({ from, to }), prev ? get(prev) : Promise.resolve(null)])
      .then(([current, previous]) => !cancelled && setState({ current, previous, loading: false, error: '' }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: errorMessage(err, 'Could not load sales trend') })));

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const rows = useMemo(() => (state.current ? fillMonths(state.current.data, from, to) : []), [state.current, from, to]);
  return { ...state, rows, previousFrom: previousRange(from, to)?.from };
}

// ---------- KPI cards ----------

function Delta({ current, previous, partial }) {
  if (previous == null || current == null) return null;
  if (partial || !previous) return <span className="text-xs text-slate-400">Not enough history to compare</span>;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${
          up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
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
    <div className="h-12 w-28" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="linear" dataKey={dataKey} stroke={SERIES} strokeWidth={1.75} fill={`url(#spark-${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon, tint, label, value, sub, spark }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${tint}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 truncate text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
        {spark}
      </div>
      <div className="mt-2 min-h-5">{sub}</div>
    </div>
  );
}

// The previous window only counts if the data actually reaches back to its start
function isPartial(previous, prevFrom) {
  if (!previous || !prevFrom) return false;
  const first = previous.data[0]?.period;
  return !first || first > prevFrom.slice(0, 7);
}

export function SalesKpiCards({ trend }) {
  const { current, previous, rows, loading } = trend;
  const t = current?.totals;
  const p = previous?.totals;
  const aov = t?.orders ? t.revenue / t.orders : 0;
  const prevAov = p ? (p.orders ? p.revenue / p.orders : 0) : null;
  const best = rows.reduce((b, r) => (!b || r.revenue > b.revenue ? r : b), null);
  const partial = isPartial(previous, trend.previousFrom);
  const deltaProps = { partial };

  return (
    <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4 lg:col-span-2 ${loading ? 'opacity-60' : ''}`}>
      <KpiCard
        icon="dollar"
        tint="bg-stone-100 text-slate-700 ring-stone-200"
        label="Total revenue"
        value={t ? currency0.format(t.revenue) : '–'}
        sub={<Delta current={t?.revenue} previous={p?.revenue} {...deltaProps} />}
        spark={<Sparkline rows={rows} dataKey="revenue" />}
      />
      <KpiCard
        icon="receipt"
        tint="bg-stone-100 text-slate-700 ring-stone-200"
        label="Orders"
        value={t ? integer.format(t.orders) : '–'}
        sub={<Delta current={t?.orders} previous={p?.orders} {...deltaProps} />}
        spark={<Sparkline rows={rows} dataKey="orders" />}
      />
      <KpiCard
        icon="cart"
        tint="bg-stone-100 text-slate-700 ring-stone-200"
        label="Avg order value"
        value={t?.orders ? currency.format(aov) : '–'}
        sub={<Delta current={aov} previous={prevAov} {...deltaProps} />}
        spark={<Sparkline rows={rows} dataKey="aov" />}
      />
      <KpiCard
        icon="trophy"
        tint="bg-stone-100 text-slate-700 ring-stone-200"
        label="Best month"
        value={best && best.revenue > 0 ? longMonth(best) : '–'}
        sub={best && best.revenue > 0 ? <span className="text-xs text-slate-500">{currency.format(best.revenue)} revenue</span> : null}
      />
    </div>
  );
}

// ---------- Main chart ----------

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="min-w-44 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 text-sm shadow-md">
      <div className="mb-2 font-semibold text-slate-900">{longMonth(row)}</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 tabular-nums">
        <dt className="flex items-center gap-2 text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: SERIES }} /> Revenue
        </dt>
        <dd className="text-right font-semibold text-slate-900">{currency.format(row.revenue)}</dd>
        <dt className="pl-4 text-slate-500">Orders</dt>
        <dd className="text-right font-medium text-slate-900">{integer.format(row.orders)}</dd>
        <dt className="pl-4 text-slate-500">Units</dt>
        <dd className="text-right font-medium text-slate-900">{integer.format(row.units)}</dd>
        <dt className="pl-4 text-slate-500">Avg order</dt>
        <dd className="text-right font-medium text-slate-900">{currency.format(row.aov)}</dd>
      </dl>
    </div>
  );
}

/** Monthly sales trend chart. `trend` comes from useSalesTrend(from, to). */
export default function SalesTrendChart({ trend }) {
  const { current, rows, loading, error } = trend;
  const [metric, setMetric] = useState('revenue');
  const [view, setView] = useState('chart');
  const gradientId = useId().replace(/:/g, '');
  const m = METRICS[metric];
  const total = current?.totals?.[metric];

  return (
    <div>
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{m.label} in selected period</div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{total != null ? m.format(total) : '–'}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'orders', label: 'Orders' },
            ]}
          />
          <SegmentedControl
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Chart', icon: 'trendingUp' },
              { value: 'table', label: 'Table', icon: 'table' },
            ]}
          />
        </div>
      </div>

      {/* Keep the previous render visible (dimmed) while refetching */}
      <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        {!loading && rows.length === 0 && !error ? (
          <div className="flex h-80 flex-col items-center justify-center text-sm text-slate-500">
            <Icon name="inbox" className="mb-2 h-8 w-8 text-slate-300" />
            No orders in this date range.
          </div>
        ) : view === 'chart' ? (
          <div className="h-80 w-full" role="img" aria-label={`Monthly ${m.label.toLowerCase()} area chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="period"
                  tickFormatter={shortPeriod}
                  tick={{ fill: AXIS_INK, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                  dy={8}
                />
                <YAxis
                  tickFormatter={m.tick}
                  tick={{ fill: AXIS_INK, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="linear"
                  dataKey={metric}
                  name={m.label}
                  stroke={SERIES}
                  strokeWidth={2}
                  fill={`url(#area-${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Month</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Orders</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Units</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Avg order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.period} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2 font-medium text-slate-900">{longMonth(r)}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{currency.format(r.revenue)}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{integer.format(r.orders)}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{integer.format(r.units)}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{r.orders ? currency.format(r.aov) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
