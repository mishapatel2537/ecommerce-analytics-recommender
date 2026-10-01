import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';

const VARIANTS = {
  primary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-300 disabled:shadow-none',
  brand: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'bg-white text-slate-900 shadow-card ring-1 ring-inset ring-stone-300 hover:bg-stone-50 hover:ring-stone-400 disabled:text-slate-400 disabled:hover:bg-white',
  ghost: 'text-slate-600 hover:bg-stone-100 hover:text-slate-900 disabled:text-slate-300 disabled:hover:bg-transparent',
  danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:text-rose-300',
  inverse: 'bg-white text-slate-900 shadow-sm hover:bg-stone-100',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
};

const ICON_SIZES = { sm: 'h-4 w-4', md: 'h-4.5 w-4.5', lg: 'h-5 w-5' };

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80 ${className}`}
    />
  );
}

/**
 * <Button>Save</Button>
 * <Button variant="secondary" icon="plus" loading={busy}>Add</Button>
 * <Button to="/cart">View cart</Button>          renders a router Link
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading = false, block = false, to, href, className = '', children, disabled, ...props },
  ref
) {
  const cls = `inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${
    VARIANTS[variant]
  } ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`;

  const content = (
    <>
      {loading ? <Spinner className={ICON_SIZES[size]} /> : icon && <Icon name={icon} className={ICON_SIZES[size]} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} className={`${ICON_SIZES[size]} transition-transform group-hover/btn:translate-x-0.5`} />}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={`group/btn ${cls}`} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={`group/btn ${cls}`} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" disabled={disabled || loading} aria-busy={loading || undefined} className={`group/btn ${cls}`} {...props}>
      {content}
    </button>
  );
});

export default Button;

/** Square icon-only button. `label` is required for screen readers. */
export const IconButton = forwardRef(function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', children, ...props }, ref) {
  const box = { sm: 'h-8 w-8 rounded-lg', md: 'h-10 w-10 rounded-xl', lg: 'h-12 w-12 rounded-xl' }[size];
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`relative inline-flex shrink-0 items-center justify-center transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${box} ${className}`}
      {...props}
    >
      <Icon name={icon} className={ICON_SIZES[size]} />
      {children}
    </button>
  );
});
