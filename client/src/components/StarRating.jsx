import { useState } from 'react';

const STAR =
  'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z';
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Star({ fill, size }) {
  // fill: 0..1 (fractional stars for averages)
  const id = `s${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
          <stop offset={`${fill * 100}%`} stopColor="#e7e5e4" />
        </linearGradient>
      </defs>
      <path d={STAR} fill={`url(#${id})`} />
    </svg>
  );
}

// Display: <StarRating value={4.3} />              (supports fractions)
// Input:   <StarRating value={r} onChange={setR} /> (click or arrow keys to set 1-5)
export default function StarRating({ value = 0, onChange, size = 18, showLabel = false, labelledBy }) {
  const [hover, setHover] = useState(0);

  if (onChange) {
    const shown = hover || value;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(5, value + 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, value - 1));
    };
    return (
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label={labelledBy ? undefined : 'Rating'} aria-labelledby={labelledBy} className="flex" onMouseLeave={() => setHover(0)} onKeyDown={onKeyDown}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              tabIndex={value === n || (!value && n === 1) ? 0 : -1}
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(n)}
              className="rounded-md p-0.5 transition-transform duration-150 hover:scale-115 active:scale-95"
            >
              <Star fill={n <= shown ? 1 : 0} size={size} />
            </button>
          ))}
        </div>
        <span className="min-w-20 text-sm font-semibold text-slate-700" aria-live="polite">{LABELS[shown]}</span>
      </div>
    );
  }

  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${v} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} fill={Math.max(0, Math.min(1, v - (n - 1)))} size={size} />
      ))}
      {showLabel && <span className="ml-1.5 text-sm font-semibold text-slate-900">{v ? v.toFixed(1) : '–'}</span>}
    </span>
  );
}
