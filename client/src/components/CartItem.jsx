import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImage } from './ProductCard';
import Icon from './Icon';
import QuantityStepper from './ui/QuantityStepper';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { errorMessage } from '../api/axios';
import { formatPrice } from '../utils/format';

/**
 * One cart line. Used by the cart page and (compact) by the cart drawer.
 * Removing shows an "Undo" toast that adds the same quantity back.
 */
export default function CartItem({ item, compact = false, onNavigate }) {
  const { updateQuantity, removeItem, addToCart } = useCart();
  const toast = useToast();
  const product = item.productId; // populated by the backend
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  if (!product) return null;

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update your cart', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    run(async () => {
      setLeaving(true);
      const qty = item.quantity;
      try {
        await removeItem(product._id);
      } catch (err) {
        setLeaving(false);
        throw err;
      }
      toast({
        tone: 'info',
        title: 'Removed from cart',
        text: product.name,
        action: { label: 'Undo', onClick: () => addToCart(product._id, qty).catch(() => {}) },
      });
    });

  const atStockLimit = item.quantity >= product.stock;
  const img = compact ? 'h-20 w-20' : 'h-24 w-24 sm:h-32 sm:w-32';

  return (
    <li
      className={`flex gap-4 transition-all duration-300 ${compact ? 'py-4' : 'py-6'} ${leaving ? 'translate-x-4 opacity-0' : 'animate-fade-in'}`}
    >
      <Link
        to={`/products/${product._id}`}
        onClick={onNavigate}
        className={`group shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200/70 ${img}`}
      >
        <ProductImage product={product} className="h-full w-full transition duration-500 group-hover:scale-105" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {!compact && <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{product.category}</p>}
            <Link
              to={`/products/${product._id}`}
              onClick={onNavigate}
              className={`line-clamp-2 font-semibold text-slate-900 transition hover:text-brand-700 ${compact ? 'text-sm' : 'mt-0.5 text-base'}`}
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-sm text-slate-500 tabular-nums">{formatPrice(product.price)} each</p>
          </div>
          <p className={`shrink-0 font-semibold text-slate-900 tabular-nums ${compact ? 'text-sm' : 'text-base'}`}>
            {formatPrice(product.price * item.quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            max={product.stock}
            busy={busy}
            onChange={(q) => run(() => updateQuantity(product._id, q))}
            onRemove={remove}
            label={`Quantity of ${product.name}`}
          />
          {!compact && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <Icon name="trash" className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
        {atStockLimit && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Icon name="info" className="h-3.5 w-3.5" /> That’s all we have in stock.
          </p>
        )}
      </div>
    </li>
  );
}
