import Icon from '../Icon';
import { Spinner } from './Button';

/**
 * − [ 2 ] +   Used on the product page and in the cart.
 * When `onRemove` is given, the minus button turns into a bin at quantity 1.
 */
export default function QuantityStepper({ value, min = 1, max = Infinity, onChange, onRemove, busy = false, size = 'md', label = 'Quantity' }) {
  const s = size === 'sm' ? { btn: 'h-8 w-8', icon: 'h-3.5 w-3.5', num: 'w-8 text-sm' } : { btn: 'h-11 w-11', icon: 'h-4 w-4', num: 'w-10 text-sm' };
  const atMin = value <= min;
  const removeMode = atMin && onRemove;

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center rounded-xl bg-white shadow-card ring-1 ring-stone-300 transition ${busy ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        onClick={() => (removeMode ? onRemove() : onChange(value - 1))}
        disabled={busy || (atMin && !onRemove)}
        aria-label={removeMode ? 'Remove item' : 'Decrease quantity'}
        className={`flex items-center justify-center rounded-l-xl text-slate-600 transition hover:bg-stone-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent ${
          removeMode ? 'hover:text-rose-600' : ''
        } ${s.btn}`}
      >
        <Icon name={removeMode ? 'trash' : 'minus'} className={s.icon} />
      </button>
      <span className={`flex items-center justify-center font-semibold text-slate-900 tabular-nums ${s.num}`} aria-live="polite" aria-atomic="true">
        {busy ? <Spinner className="h-3.5 w-3.5 text-slate-400" /> : <span key={value} className="animate-fade-in">{value}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={busy || value >= max}
        aria-label="Increase quantity"
        className={`flex items-center justify-center rounded-r-xl text-slate-600 transition hover:bg-stone-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent ${s.btn}`}
      >
        <Icon name="plus" className={s.icon} />
      </button>
    </div>
  );
}
