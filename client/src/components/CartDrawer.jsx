import Dialog from './ui/Dialog';
import Button from './ui/Button';
import { EmptyState } from './ui/States';
import CartItem from './CartItem';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

/** Slide-over mini cart opened from the navbar cart button */
export default function CartDrawer() {
  const { items, cartCount, subtotal, drawerOpen, closeCart } = useCart();

  return (
    <Dialog
      open={drawerOpen}
      onClose={closeCart}
      variant="right"
      title="Your cart"
      description={cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'}` : undefined}
      footer={
        items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-lg font-semibold text-slate-900 tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <p className="-mt-2 text-xs text-slate-500">Shipping is free. No real payment is taken at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" to="/cart" onClick={closeCart}>
                View cart
              </Button>
              <Button to="/checkout" onClick={closeCart} iconRight="arrowRight">
                Checkout
              </Button>
            </div>
          </div>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState
          compact
          icon="cart"
          title="Your cart is waiting for something great"
          text="Add a few products and they’ll show up here."
          action={
            <Button variant="secondary" to="/shop" onClick={closeCart}>
              Browse products
            </Button>
          }
          className="mt-10"
        />
      ) : (
        <ul className="divide-y divide-stone-200 px-5 sm:px-6">
          {items.map((item) => (
            <CartItem key={item.productId._id} item={item} compact onNavigate={closeCart} />
          ))}
        </ul>
      )}
    </Dialog>
  );
}
