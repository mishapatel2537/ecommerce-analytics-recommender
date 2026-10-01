export default function OrderRow({ order }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
        <span style={{ textTransform: 'capitalize' }}>{order.status}</span>
      </div>
      <ul>
        {order.items.map((it, idx) => (
          <li key={idx}>{it.name} × {it.quantity} (₹{it.price})</li>
        ))}
      </ul>
      <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
    </div>
  );
}