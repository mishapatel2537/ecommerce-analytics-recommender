import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errorMessage } from '../api/axios';
import { SegmentedControl } from './DashboardLayout';

// Chart tokens (categorical slot 1 + recessive grid/axis ink)
const SERIES_COLOR = '#2a78d6';
const GRID_COLOR = '#e5e7eb';
const AXIS_INK = '#6b7280';
const SURFACE = '#ffffff';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat('en-US');

const METRICS = {
  revenue: { label: 'Revenue', format: (v) => currency.format(v), tick: (v) => compactCurrency.format(v) },
  orders: { label: 'Orders', format: (v) => integer.format(v), tick: (v) => integer.format(v) },
};

// "2026-03" -> "Mar '26"
const shortPeriod = (period) => `${MONTHS[Number(period.slice(5, 7)) - 1]} '${period.slice(2, 4)}`;
const longMonth = (row) => `${MONTHS[row.month - 1]} ${row.year}`;

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
    out.push(byPeriod.get(period) || { period, year: y, month: m, revenue: 0, orders: 0, units: 0 });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const aov = row.orders ? row.revenue / row.orders : 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
      <div className="mb-1 font-semibold text-gray-900">{longMonth(row)}</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 tabular-nums">
        <dt className="text-gray-500">Revenue</dt>
        <dd className="text-right font-medium text-gray-900">{currency.format(row.revenue)}</dd>
        <dt className="text-gray-500">Orders</dt>
        <dd className="text-right font-medium text-gray-900">{integer.format(row.orders)}</dd>
        <dt className="text-gray-500">Units</dt>
        <dd className="text-right font-medium text-gray-900">{integer.format(row.units)}</dd>
        <dt className="text-gray-500">Avg order</dt>
        <dd className="text-right font-medium text-gray-900">{currency.format(aov)}</dd>
      </dl>
    </div>
  );
}

/** Monthly sales trend for the admin dashboard. from / to: 'YYYY-MM-DD' or '' */
export default function SalesTrendChart({ from, to }) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metric, setMetric] = useState('revenue');
  const [view, setView] = useState('chart');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/analytics/sales-trend', { params: { from: from || undefined, to: to || undefined } })
      .then((res) => !cancelled && setResponse(res.data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load sales trend')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const rows = useMemo(() => (response ? fillMonths(response.data, from, to) : []), [response, from, to]);
  const totals = response?.totals;
  const best = rows.reduce((b, r) => (!b || r.revenue > b.revenue ? r : b), null);
  const m = METRICS[metric];

  return (
    <div>
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Keep the previous render visible (dimmed) while refetching */}
      <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Revenue" value={totals ? currency.format(totals.revenue) : '–'} />
          <StatTile label="Orders" value={totals ? integer.format(totals.orders) : '–'} />
          <StatTile
            label="Avg order value"
            value={totals?.orders ? currency.format(totals.revenue / totals.orders) : '–'}
          />
          <StatTile
            label="Best month"
            value={best && best.revenue > 0 ? longMonth(best) : '–'}
            hint={best && best.revenue > 0 ? currency.format(best.revenue) : undefined}
          />
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
        </div>

        {!loading && rows.length === 0 && !error ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-500">No orders in this date range.</div>
        ) : view === 'chart' ? (
          <div className="h-72 w-full" role="img" aria-label={`Monthly ${m.label.toLowerCase()} line chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis
                  dataKey="period"
                  tickFormatter={shortPeriod}
                  tick={{ fill: AXIS_INK, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: GRID_COLOR }}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={m.tick}
                  tick={{ fill: AXIS_INK, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: AXIS_INK, strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line
                  type="linear"
                  dataKey={metric}
                  name={m.label}
                  stroke={SERIES_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: SERIES_COLOR, stroke: SURFACE, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="max-h-72 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Units</th>
                  <th className="px-3 py-2 text-right font-medium">Avg order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.period}>
                    <td className="px-3 py-1.5 text-gray-900">{longMonth(r)}</td>
                    <td className="px-3 py-1.5 text-right">{currency.format(r.revenue)}</td>
                    <td className="px-3 py-1.5 text-right">{integer.format(r.orders)}</td>
                    <td className="px-3 py-1.5 text-right">{integer.format(r.units)}</td>
                    <td className="px-3 py-1.5 text-right">
                      {r.orders ? currency.format(r.revenue / r.orders) : '–'}
                    </td>
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
