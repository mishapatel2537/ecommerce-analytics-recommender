import { useState } from 'react';

const GOLD = '#f59e0b';
const GREY = '#dbe0ea';

// Display: <StarRating value={4.3} />              (supports fractions)
// Input:   <StarRating value={r} onChange={setR} /> (click to set 1-5)
export default function StarRating({ value = 0, onChange, size = 18 }) {
  const [hover, setHover] = useState(0);

  if (onChange) {
    const shown = hover || value;
    return (
      <span role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="star-btn"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            style={{ fontSize: size, color: n <= shown ? GOLD : GREY }}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            {'\u2605'}
          </button>
        ))}
      </span>
    );
  }

  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span
      aria-label={`${value} out of 5`}
      style={{ position: 'relative', display: 'inline-block', fontSize: size, lineHeight: 1, letterSpacing: 1 }}
    >
      <span style={{ color: GREY }}>{'\u2605\u2605\u2605\u2605\u2605'}</span>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${pct}%`,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          color: GOLD,
        }}
      >
        {'\u2605\u2605\u2605\u2605\u2605'}
      </span>
    </span>
  );
}
