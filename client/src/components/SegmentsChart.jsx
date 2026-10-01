import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState, ErrorState } from './ui/States';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import { formatPriceRounded } from '../utils/format';

// Tiers are ordered (low -> high spend), so they get one hue from light to dark.
const COLORS = { Bronze: '#c7d2fe', Silver: '#818cf8', Gold: '#4f46e5', Platinum: '#312e81' };
const SURFACE = '#ffffff';

function SegmentTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-stone-200 bg-white/95 px-3.5 py-3 text-sm shadow-pop backdrop-blur">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[d.tier] }} /> {d.tier}
      </p>
      <p className="mb-1.5 text-xs text-slate-500">{d.range}</p>
      <p className="text-slate-600 tabular-nums">{d.customers} customers</p>
      <p className="text-slate-600 tabular-nums">Avg spend {formatPriceRounded(d.avgSpend)}</p>
    </div>
  );
}

/**
 * Customer spend tiers (Person C's /analytics/segments).
 * The dashboard fetches the data (KPI cards use it too) and passes it in.
 */
export default function SegmentsChart({ data, error, loading, onRetry }) {
  const [active, setActive] = useState(null);
  const reduced = usePrefersReducedMotion();

  if (error && !data) return <ErrorState compact title="Segments didn’t load" text={error} onRetry={onRetry} />;
  if (!data) {
    return (
      <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]" aria-hidden="true">
        <div className="skeleton mx-auto h-48 w-48 rounded-full" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalCustomers = data.reduce((s, d) => s + d.customers, 0);
  const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
  if (!totalCustomers) return <EmptyState compact icon="users" title="No data available for this period" text="No customer orders in this date range." />;

  const pieData = data.filter((d) => d.customers > 0);
  const focus = data.find((d) => d.tier === active);

  return (
    <div className={`grid items-center gap-6 transition-opacity duration-200 sm:grid-cols-[210px_1fr] ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
      <div className="relative mx-auto h-52 w-52 sm:h-56 sm:w-full" role="img" aria-label={`Donut chart of ${totalCustomers} customers by spend tier`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="customers"
              nameKey="tier"
              innerRadius="66%"
              outerRadius="96%"
              paddingAngle={1.5}
              cornerRadius={4}
              stroke={SURFACE}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={!reduced}
              animationDuration={700}
              onMouseEnter={(d) => setActive(d.tier)}
              onMouseLeave={() => setActive(null)}
            >
              {pieData.map((d) => (
                <Cell key={d.tier} fill={COLORS[d.tier]} opacity={!active || active === d.tier ? 1 : 0.3} style={{ transition: 'opacity 200ms', outline: 'none' }} />
              ))}
            </Pie>
            <Tooltip isAnimationActive={false} content={<SegmentTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span key={focus?.tier || 'all'} className="animate-fade-in text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {focus ? focus.customers : totalCustomers}
          </span>
          <span className="text-xs text-slate-500">{focus ? `${focus.tier} customers` : 'customers'}</span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {data.map((d) => {
          const share = (d.customers / totalCustomers) * 100;
          const revShare = totalRevenue ? (d.totalRevenue / totalRevenue) * 100 : 0;
          return (
            <li key={d.tier}>
              <button
                type="button"
                onMouseEnter={() => setActive(d.tier)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d.tier)}
                onBlur={() => setActive(null)}
                className={`w-full rounded-xl px-3 py-2.5 text-left transition ${active === d.tier ? 'bg-stone-100' : 'hover:bg-stone-50'} ${
                  active && active !== d.tier ? 'opacity-50' : ''
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[d.tier] }} />
                  <span className="text-sm font-semibold text-slate-900">{d.tier}</span>
                  <span className="truncate text-xs text-slate-500">{d.range}</span>
                  <span className="ml-auto text-sm font-semibold text-slate-900 tabular-nums">{Math.round(share)}%</span>
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-4 pl-5 text-xs text-slate-500 tabular-nums">
                  <span>{d.customers} customers</span>
                  <span>avg {formatPriceRounded(d.avgSpend)}</span>
                  <span className="font-medium text-slate-700">{Math.round(revShare)}% of revenue</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
