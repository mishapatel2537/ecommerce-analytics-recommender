import { useState } from 'react';
import DashboardLayout, { DashboardPanel, DateRangeFilter, rangeForPreset } from '../components/DashboardLayout';
import SalesTrendChart, { SalesKpiCards, useSalesTrend } from '../components/SalesTrendChart';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

function PanelPlaceholder({ icon, owner, text }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-700">Coming soon</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        {text} <span className="font-medium whitespace-nowrap text-slate-600">({owner})</span>
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  // One date range for the whole dashboard; every panel receives from / to
  const [range, setRange] = useState(() => rangeForPreset('12m'));
  const trend = useSalesTrend(range.from, range.to);

  return (
    <DashboardLayout
      title="Overview"
      subtitle={`Welcome back${user ? `, ${user.name}` : ''}. Here’s how the store is performing.`}
      filters={<DateRangeFilter value={range} onChange={setRange} />}
    >
      <SalesKpiCards trend={trend} />

      <DashboardPanel
        id="sales"
        icon="trendingUp"
        title="Sales trend"
        description="Monthly revenue and orders · cancelled orders excluded"
        wide
      >
        <SalesTrendChart trend={trend} />
      </DashboardPanel>

      {/* Person B: replace the placeholder with <TopProductsChart from={range.from} to={range.to} /> */}
      <DashboardPanel id="top-products" icon="chart" title="Top products" description="Best sellers by quantity and revenue">
        <PanelPlaceholder icon="chart" owner="Person B" text="Top-selling products bar chart." />
      </DashboardPanel>

      {/* Person C: replace the placeholder with <SegmentsChart from={range.from} to={range.to} /> */}
      <DashboardPanel id="segments" icon="users" title="Customer segments" description="Customers grouped by spend tier">
        <PanelPlaceholder icon="pie" owner="Person C" text="Spend-tier customer segments chart." />
      </DashboardPanel>
    </DashboardLayout>
  );
}
