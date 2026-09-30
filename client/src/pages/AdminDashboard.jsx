import { useState } from 'react';
import DashboardLayout, { DashboardPanel, DateRangeFilter, rangeForPreset } from '../components/DashboardLayout';
import SalesTrendChart from '../components/SalesTrendChart';

function PanelPlaceholder({ owner }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
      Coming soon ({owner})
    </div>
  );
}

export default function AdminDashboard() {
  // One date range for the whole dashboard; every panel receives from / to
  const [range, setRange] = useState(() => rangeForPreset('12m'));

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Sales performance from MongoDB aggregation pipelines"
      filters={<DateRangeFilter value={range} onChange={setRange} />}
    >
      <DashboardPanel title="Sales trend" description="Monthly revenue and orders (cancelled orders excluded)" wide>
        <SalesTrendChart from={range.from} to={range.to} />
      </DashboardPanel>

      {/* Person B: replace the placeholder with <TopProductsChart from={range.from} to={range.to} /> */}
      <DashboardPanel title="Top products" description="Best sellers by quantity and revenue">
        <PanelPlaceholder owner="Person B" />
      </DashboardPanel>

      {/* Person C: replace the placeholder with <SegmentsChart from={range.from} to={range.to} /> */}
      <DashboardPanel title="Customer segments" description="Customers grouped by spend tier">
        <PanelPlaceholder owner="Person C" />
      </DashboardPanel>
    </DashboardLayout>
  );
}
