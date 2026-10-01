import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';

export default function Cart() {
  const { cart, updateQuantity, removeItem } = useCart();

  if (cart.items.length === 0) {
    return <div style={{ padding: 24 }}><h2>Your cart is empty</h2><Link to="/">Continue shopping</Link></div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>Your Cart</h2>
      {cart.items.map(item => (
        <CartItem
          key={item.productId?._id}
          item={item}
          onChangeQty={updateQuantity}
          onRemove={removeItem}
        />
      ))}
      <CartSummary items={cart.items}>
        <Link to="/checkout"><button>Proceed to Checkout</button></Link>
      </CartSummary>
    </div>
  );
}