import { useEffect, useState } from 'react';
import OrderRow from '../components/OrderRow';
import api from '../api/axios'; // from Person A

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data)).catch(() => setOrders([]));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>My Orders</h2>
      {orders.length === 0 ? <p>No orders yet.</p> : orders.map(o => <OrderRow key={o._id} order={o} />)}
    </div>
  );
}