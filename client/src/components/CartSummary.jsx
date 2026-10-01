export default function CartSummary({ items, children }) {
  const total = items.reduce((sum, i) => sum + (i.productId?.price || 0) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h3>Order Summary</h3>
      <p>Items: {count}</p>
      <p><strong>Total: ₹{total.toFixed(2)}</strong></p>
      {children}
    </div>
  );
}