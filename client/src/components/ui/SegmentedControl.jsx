import { useLayoutEffect, useRef, useState } from 'react';
import Icon from '../Icon';

/**
 * Toggle between a few options, with a pill that slides to the active one.
 * <SegmentedControl label="Metric" value={m} onChange={setM} options={[{ value, label, icon? }]} />
 */
export default function SegmentedControl({ options, value, onChange, label, size = 'md', className = '' }) {
  const wrap = useRef(null);
  const [pill, setPill] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector('[aria-pressed="true"]');
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [value, options.length]);

  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div ref={wrap} role="group" aria-label={label} className={`relative inline-flex max-w-full rounded-xl bg-stone-200/60 p-1 ${className}`}>
      {pill && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm ring-1 ring-stone-200/80 transition-all duration-300 ease-[var(--ease-snappy)]"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`relative z-10 flex items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${pad} ${
            value === o.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
