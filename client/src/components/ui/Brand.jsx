import { Link } from 'react-router-dom';
import Icon from '../Icon';

export function Logo({ dark = false, compact = false, to = '/' }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5 rounded-lg" aria-label="E-commerce Analytics home">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:-rotate-6 ${
          dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        <Icon name="logo" className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className={`text-[15px] font-semibold tracking-tight whitespace-nowrap ${dark ? 'text-white' : 'text-slate-900'}`}>
          E-commerce <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Analytics</span>
        </span>
      )}
    </Link>
  );
}

// A few calm tints so different people don't all get the same avatar colour
const TINTS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-stone-200 text-stone-700',
];

export function Avatar({ name = '', className = 'h-8 w-8 text-xs' }) {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?';
  const tint = TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${tint} ${className}`}>
      {initials}
    </span>
  );
}
