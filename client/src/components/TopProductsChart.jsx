import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/axios'; // from Person A

export default function TopProductsChart({ from, to }) {
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState('quantity');

  useEffect(() => {
    api.get('/analytics/top-products', { params: { sortBy, limit: 5, from, to } })
      .then(res => setData(res.data))
      .catch(() => setData([]));
  }, [sortBy, from, to]);

  const dataKey = sortBy === 'revenue' ? 'totalRevenue' : 'totalQuantity';

  return (
    <div>
      <h3>Top Products</h3>
      <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="quantity">By quantity sold</option>
        <option value="revenue">By revenue</option>
      </select>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}