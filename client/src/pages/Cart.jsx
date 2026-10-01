import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/States';
import CheckoutSteps from '../components/CheckoutSteps';

function CartSkeleton() {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]" aria-hidden="true">
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton h-28 w-28 rounded-xl" />
            <div className="flex-1 space-y-2.5 pt-2">
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton mt-6 h-8 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}

export default function Cart() {
  const { items, cartCount, loading } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <CheckoutSteps current={0} />
      <PageHeader
        className="mt-8"
        title="Your cart"
        description={items.length ? `${cartCount} item${cartCount === 1 ? '' : 's'} ready for checkout` : undefined}
      />

      {loading && !items.length ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="cart"
          title="Your cart is waiting for something great"
          text="Browse the shop and add products you like. They’ll be saved here."
          action={
            <Button to="/shop" iconRight="arrowRight">
              Start shopping
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200/80 bg-white px-5 shadow-card sm:px-6">
            {items.map((item) => (
              <CartItem key={item.productId._id} item={item} />
            ))}
          </ul>
          <div>
            <CartSummary items={items}>
              <Button to="/checkout" size="lg" block iconRight="arrowRight">
                Proceed to checkout
              </Button>
              <Button to="/shop" variant="ghost" block className="mt-2">
                Continue shopping
              </Button>
            </CartSummary>
          </div>
        </div>
      )}
    </div>
  );
}
