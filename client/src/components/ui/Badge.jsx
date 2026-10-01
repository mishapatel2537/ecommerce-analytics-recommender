const TONES = {
  neutral: 'bg-stone-100 text-slate-700 ring-stone-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  dark: 'bg-slate-900/85 text-white ring-transparent',
  white: 'bg-white/95 text-slate-800 ring-stone-200/60 shadow-sm',
};

const DOTS = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  dark: 'bg-white',
  white: 'bg-amber-500',
};

/** Small status label. <Badge tone="success" dot>In stock</Badge> */
export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  );
}

// Order status values from the shared Order schema (always lowercase)
const STATUS_TONES = { pending: 'warning', paid: 'info', shipped: 'brand', delivered: 'success', cancelled: 'neutral' };

export function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONES[status] || 'neutral'} dot className="capitalize">
      {status}
    </Badge>
  );
}

/** Stock state shared by cards, product page and admin lists */
export function stockState(stock) {
  if (stock <= 0) return { tone: 'danger', label: 'Out of stock', short: 'Sold out' };
  if (stock < 10) return { tone: 'warning', label: `Only ${stock} left`, short: `${stock} left` };
  return { tone: 'success', label: 'In stock', short: 'In stock' };
}
