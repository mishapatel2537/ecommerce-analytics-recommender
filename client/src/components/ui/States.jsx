import Icon from '../Icon';
import Button from './Button';

/**
 * Friendly placeholder for "nothing here yet".
 * <EmptyState icon="cart" title="..." text="..." action={<Button to="/shop">Shop</Button>} />
 */
export function EmptyState({ icon = 'inbox', title, text, action, compact = false, className = '' }) {
  return (
    <div
      className={`flex animate-fade-in flex-col items-center text-center ${
        compact ? 'px-4 py-10' : 'rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 sm:py-20'
      } ${className}`}
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-card ring-1 ring-stone-200">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-5 text-base font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{text}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Something failed. Shows a plain-language message and an optional retry. */
export function ErrorState({ title = 'Something went wrong', text, onRetry, compact = false, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex animate-fade-in flex-col items-center text-center ${
        compact ? 'px-4 py-8' : 'rounded-3xl border border-rose-200 bg-rose-50/50 px-6 py-14'
      } ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-card ring-1 ring-rose-100">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry} className="mt-5">
          Try again
        </Button>
      )}
    </div>
  );
}

/** Inline error line for small panels */
export function InlineError({ children, onRetry }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      <Icon name="alert" className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold text-rose-700 underline underline-offset-4 hover:text-rose-900">
          Retry
        </button>
      )}
    </div>
  );
}
