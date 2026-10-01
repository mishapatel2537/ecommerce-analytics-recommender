import { useEffect, useId, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errorMessage } from '../api/axios';
import SegmentedControl from './ui/SegmentedControl';
import { EmptyState, ErrorState } from './ui/States';
import Icon from './Icon';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

// Chart tokens: one brand series + recessive grid / axis ink; previous period in neutral grey
export const SERIES = '#4f46e5';
const PREVIOUS = '#a8a29e';
const GRID = '#efedeb';
const AXIS_INK = '#78716c';
const SURFACE = '#ffffff';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 24 * 60 * 60 * 1000;

export const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const currency0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
export const integer = new Intl.NumberFormat('en-US');

const METRICS = {
  revenue: { label: 'Revenue', format: (v) => currency.format(v), tick: (v) => compactCurrency.format(v) },
  orders: { label: 'Orders', format: (v) => integer.format(v), tick: (v) => integer.format(v) },
};

// "2026-03" -> "Mar '26"
const shortPeriod = (period) => `${MONTHS[Number(period.slice(5, 7)) - 1]} '${period.slice(2, 4)}`;
export const longMonth = (row) => `${MONTHS[row.month - 1]} ${row.year}`;
const toISODate = (d) => d.toISOString().slice(0, 10);
const CURRENT_PERIOD = new Date().toISOString().slice(0, 7); // this month is still in progress

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
    out.push({ ...row, aov: row.orders ? row.revenue / row.orders : 0, partial: period === CURRENT_PERIOD });
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
  const [tick, setTick] = useState(0);
  const prev = useMemo(() => previousRange(from, to), [from, to]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));

    const get = (range) =>
      api.get('/analytics/sales-trend', { params: { from: range.from || undefined, to: range.to || undefined } }).then((r) => r.data);

    Promise.all([get({ from, to }), prev ? get(prev) : Promise.resolve(null)])
      .then(([current, previous]) => !cancelled && setState({ current, previous, loading: false, error: '' }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: errorMessage(err, 'Could not load the sales trend') })));

    return () => {
      cancelled = true;
    };
  }, [from, to, prev, tick]);

  const rows = useMemo(() => (state.current ? fillMonths(state.current.data, from, to) : []), [state.current, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const previousRows = useMemo(
    () => (state.previous && prev ? fillMonths(state.previous.data, prev.from, prev.to) : []),
    [state.previous, prev]
  );

  return { ...state, rows, previousRows, previousFrom: prev?.from, reload: () => setTick((t) => t + 1) };
}

// The previous window only counts if the data actually reaches back to its start
export function isPartial(previous, prevFrom) {
  if (!previous || !prevFrom) return false;
  const first = previous.data[0]?.period;
  return !first || first > prevFrom.slice(0, 7);
}

// ---------- Chart ----------

function TrendTooltip({ active, payload, metric, compare }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const m = METRICS[metric];
  const prev = row.prev;
  const delta = compare && prev ? ((row[metric] - prev) / prev) * 100 : null;
  return (
    <div className="min-w-52 rounded-xl border border-stone-200 bg-white/95 px-3.5 py-3 text-sm shadow-pop backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-semibold text-slate-900">{longMonth(row)}</span>
        {row.partial && <span className="text-xs text-slate-500">month to date</span>}
      </div>
      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 tabular-nums">
        <dt className="flex items-center gap-2 text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: SERIES }} /> {m.label}
        </dt>
        <dd className="text-right font-semibold text-slate-900">{m.format(row[metric])}</dd>
        {compare && prev != null && (
          <>
            <dt className="flex items-center gap-2 text-slate-500">
              <span className="h-0.5 w-2 rounded-full" style={{ background: PREVIOUS }} /> Previous
            </dt>
            <dd className="text-right font-medium text-slate-700">
              {m.format(prev)}
              {delta != null && isFinite(delta) && (
                <span className={`ml-1.5 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {delta >= 0 ? '+' : ''}
                  {delta.toFixed(0)}%
                </span>
              )}
            </dd>
          </>
        )}
        <dt className="pl-4 text-slate-500">{metric === 'revenue' ? 'Orders' : 'Revenue'}</dt>
        <dd className="text-right font-medium text-slate-900">{metric === 'revenue' ? integer.format(row.orders) : currency.format(row.revenue)}</dd>
        <dt className="pl-4 text-slate-500">Units</dt>
        <dd className="text-right font-medium text-slate-900">{integer.format(row.units)}</dd>
        <dt className="pl-4 text-slate-500">Avg order</dt>
        <dd className="text-right font-medium text-slate-900">{row.orders ? currency.format(row.aov) : '–'}</dd>
      </dl>
    </div>
  );
}

/** Monthly sales trend chart. `trend` comes from useSalesTrend(from, to). */
export default function SalesTrendChart({ trend }) {
  const { current, rows, previousRows, loading, error, reload } = trend;
  const [metric, setMetric] = useState('revenue');
  const [view, setView] = useState('chart');
  const [compare, setCompare] = useState(false);
  const reduced = usePrefersReducedMotion();
  const gradientId = useId().replace(/:/g, '');
  const m = METRICS[metric];
  const total = current?.totals?.[metric];

  // Previous period lines up month-by-month only when both windows have the same length
  const canCompare = previousRows.length > 0 && previousRows.length === rows.length;
  const data = useMemo(
    () => rows.map((r, i) => ({ ...r, prev: canCompare ? previousRows[i][metric] : null })),
    [rows, previousRows, canCompare, metric]
  );
  const prevTotal = canCompare ? previousRows.reduce((s, r) => s + r[metric], 0) : null;
  const monthsWithSales = rows.filter((r) => r[metric] > 0).length;
  const average = monthsWithSales ? rows.reduce((s, r) => s + r[metric], 0) / rows.length : 0;

  if (error && !current) return <ErrorState compact title="The sales trend didn’t load" text={error} onRetry={reload} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <div className="text-sm text-slate-500">{m.label} in period</div>
            <div className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{total != null ? m.format(total) : '–'}</div>
          </div>
          {rows.length > 1 && (
            <div className="pb-1">
              <div className="text-xs text-slate-500">Monthly average</div>
              <div className="text-sm font-semibold text-slate-700 tabular-nums">{m.format(average)}</div>
            </div>
          )}
          {compare && prevTotal != null && (
            <div className="animate-fade-in pb-1">
              <div className="text-xs text-slate-500">Previous period</div>
              <div className="text-sm font-semibold text-slate-700 tabular-nums">{m.format(prevTotal)}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {canCompare && view === 'chart' && (
        <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
          Compare with previous period
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: PREVIOUS }} aria-hidden="true" />
        </label>
      )}

      {/* Keep the previous render visible (dimmed) while refetching */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        {!current ? (
          <div className="skeleton h-80 rounded-xl" />
        ) : rows.length === 0 ? (
          <EmptyState compact icon="inbox" title="No data available for this period" text="There were no orders in this date range." />
        ) : view === 'chart' ? (
          <div className="h-80 w-full" role="img" aria-label={`Monthly ${m.label.toLowerCase()} area chart, ${rows.length} months`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
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
                <YAxis tickFormatter={m.tick} tick={{ fill: AXIS_INK, fontSize: 12 }} tickLine={false} axisLine={false} width={60} allowDecimals={false} />
                <Tooltip
                  isAnimationActive={false}
                  content={<TrendTooltip metric={metric} compare={compare} />}
                  cursor={{ stroke: '#a8a29e', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                {compare && (
                  <Line type="monotone" dataKey="prev" stroke={PREVIOUS} strokeWidth={1.75} strokeDasharray="5 5" dot={false} activeDot={false} isAnimationActive={!reduced} animationDuration={500} />
                )}
                <Area
                  type="monotone"
                  dataKey={metric}
                  name={m.label}
                  stroke={SERIES}
                  strokeWidth={2.25}
                  fill={`url(#area-${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                  isAnimationActive={!reduced}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="max-h-80 overflow-auto rounded-xl border border-stone-200">
            <table className="w-full text-sm tabular-nums">
              <caption className="sr-only">Monthly sales</caption>
              <thead className="sticky top-0 bg-stone-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Month</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Revenue</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Orders</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Units</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Avg order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((r) => (
                  <tr key={r.period} className="transition hover:bg-stone-50/80">
                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-900">
                      {longMonth(r)}
                      {r.partial && <span className="ml-1.5 text-xs font-normal text-slate-400">to date</span>}
                    </th>
                    <td className="px-4 py-2.5 text-right text-slate-700">{currency.format(r.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{integer.format(r.orders)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{integer.format(r.units)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{r.orders ? currency.format(r.aov) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {error && current && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-600">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
