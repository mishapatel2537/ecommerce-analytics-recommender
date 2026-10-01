import { useState } from 'react';
import DashboardLayout, { DashboardPanel, DateRangeFilter, rangeForPreset } from '../components/DashboardLayout';
import SalesTrendChart, { useSalesTrend } from '../components/SalesTrendChart';
import KpiCards from '../components/KpiCards';
import TopProductsChart from '../components/TopProductsChart'; // Person B
import LowStockList from '../components/LowStockList'; // Person B
import SegmentsChart from '../components/SegmentsChart'; // Person C
import api from '../api/axios';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function AdminDashboard() {
  const { user } = useAuth();
  // One date range for the whole dashboard; every panel receives from / to
  const [range, setRange] = useState(() => rangeForPreset('12m'));
  const trend = useSalesTrend(range.from, range.to);
  // Segments feed both the KPI row (active customers) and the segments panel
  const segments = useApi(() => api.get('/analytics/segments', { params: { from: range.from || undefined, to: range.to || undefined } }), [range.from, range.to], {
    fallback: 'Could not load segments',
  });

  return (
    <DashboardLayout
      title="Overview"
      subtitle={`${greeting()}${user ? `, ${user.name}` : ''}. Here’s how the store is performing.`}
      filters={<DateRangeFilter value={range} onChange={setRange} />}
    >
      <KpiCards trend={trend} segments={segments.data} />

      {/* Person A */}
      <DashboardPanel
        id="sales"
        icon="trendingUp"
        title="Sales trend"
        description="Monthly revenue and orders · cancelled orders excluded · the current month is month-to-date"
        wide
      >
        <SalesTrendChart trend={trend} />
      </DashboardPanel>

      {/* Person B */}
      <DashboardPanel id="top-products" icon="trophy" title="Top products" description="Best sellers in the selected period">
        <TopProductsChart from={range.from} to={range.to} />
      </DashboardPanel>

      {/* Person C */}
      <DashboardPanel
        id="segments"
        icon="users"
        title="Customer segments"
        description={range.from ? 'Customers by spend in the selected period' : 'Customers by lifetime spend'}
      >
        <SegmentsChart data={segments.data} error={segments.error} loading={segments.loading} onRetry={segments.reload} />
      </DashboardPanel>

      {/* Person B */}
      <DashboardPanel id="inventory" icon="cube" title="Low stock" description="Products with 10 or fewer units left · always current, not filtered by date" wide>
        <LowStockList />
      </DashboardPanel>
    </DashboardLayout>
  );
}
