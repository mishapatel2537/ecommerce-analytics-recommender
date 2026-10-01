import { useEffect, useRef, useState } from 'react';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';

/**
 * Counts from the previous value to the new one (ease-out, ~700ms).
 * <AnimatedNumber value={1234.5} format={(n) => usd.format(n)} />
 */
export default function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString(), duration = 700 }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced || typeof value !== 'number') {
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    const begin = from.current;
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const v = begin + (value - begin) * eased;
      from.current = v; // an interrupted count continues from where it got to
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced, duration]);

  // Screen readers get the final value straight away
  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
