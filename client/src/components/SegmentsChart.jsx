import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios.js';
import { formatINR } from '../utils/theme.js';

const COLORS = { Bronze: '#c2763a', Silver: '#94a3b8', Gold: '#eab308', Platinum: '#6366f1' };

function SegmentTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tooltip">
      <strong>{d.tier}</strong>
      <div>{d.customers} customers</div>
      <div>Avg spend {formatINR(d.avgSpend)}</div>
      <div>Revenue {formatINR(d.totalRevenue)}</div>
    </div>
  );
}

// <SegmentsChart />  (needs an admin session)
export default function SegmentsChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/analytics/segments')
      .then((res) => setData(res.data))
      .catch((err) => {
        const s = err.response?.status;
        setError(s === 403 ? 'Admin access required.' : s === 401 ? 'Please sign in as an admin.' : 'Could not load segments.');
      });
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted">Loading segments...</p>;

  const totalCustomers = data.reduce((s, d) => s + d.customers, 0);
  const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
  if (!totalCustomers) return <p className="empty">No customer data yet.</p>;
  const pieData = data.filter((d) => d.customers > 0);

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Customers</span>
          <span className="kpi-value">{totalCustomers}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Total revenue</span>
          <span className="kpi-value">{formatINR(totalRevenue)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Avg spend per customer</span>
          <span className="kpi-value">{formatINR(Math.round(totalRevenue / totalCustomers))}</span>
        </div>
      </div>

      <section className="panel">
        <h2>Customer segments</h2>
        <p className="muted" style={{ marginTop: -6 }}>Customers grouped by lifetime spend.</p>
        <div className="seg-layout">
          <div className="seg-chart">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="customers" nameKey="tier" innerRadius={72} outerRadius={110} paddingAngle={2} stroke="none">
                  {pieData.map((d) => (
                    <Cell key={d.tier} fill={COLORS[d.tier] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<SegmentTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="seg-tiers">
            {data.map((d) => {
              const share = totalCustomers ? (d.customers / totalCustomers) * 100 : 0;
              return (
                <div className="tier" key={d.tier}>
                  <div className="tier-head">
                    <span className="dot" style={{ background: COLORS[d.tier] }} />
                    <strong>{d.tier}</strong>
                    <span className="muted tier-range">{d.range}</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${share}%`, background: COLORS[d.tier] }} /></div>
                  <div className="tier-stats">
                    <span>{d.customers} customers ({Math.round(share)}%)</span>
                    <span>Avg {formatINR(d.avgSpend)}</span>
                    <span>Revenue {formatINR(d.totalRevenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
