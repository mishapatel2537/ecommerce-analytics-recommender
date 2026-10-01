export default function CartItem({ item, onChangeQty, onRemove }) {
  const product = item.productId; // filled in by the backend
  if (!product) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #ddd' }}>
      <div>
        <strong>{product.name}</strong>
        <div>₹{product.price}</div>
      </div>
      <div>
        <button onClick={() => onChangeQty(product._id, item.quantity - 1)}>-</button>
        <span style={{ margin: '0 10px' }}>{item.quantity}</span>
        <button
          onClick={() => onChangeQty(product._id, item.quantity + 1)}
          disabled={item.quantity >= product.stock}
        >+</button>
      </div>
      <div>₹{(product.price * item.quantity).toFixed(2)}</div>
      <button onClick={() => onRemove(product._id)}>Remove</button>
    </div>
  );
}