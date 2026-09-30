import { useEffect, useState } from 'react';
import Icon, { categoryIcon } from './Icon';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const inputClass =
  'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-4 focus:ring-stone-200 focus:outline-none';

// Text input that reports its value after the user stops typing
export function DebouncedInput({ value, onChange, delay = 350, className = inputClass, ...props }) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const id = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(id);
  }, [text, value, delay, onChange]);

  return <input {...props} value={text} onChange={(e) => setText(e.target.value)} className={className} />;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 ring-1 ring-stone-200 hover:text-slate-900 hover:ring-stone-300'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Category chips + price / sort / stock toolbar. (Search lives in the page hero.)
 * filters: { search, category, minPrice, maxPrice, sort, inStock }
 * onChange(partialFilters)
 */
export default function SearchFilterBar({ filters, categories, total, onChange, onReset }) {
  const hasFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.inStock;
  const allCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
        <Chip active={!filters.category} onClick={() => onChange({ category: '' })}>
          <Icon name="grid" className="h-4 w-4" /> All
          {allCount > 0 && <span className="text-xs opacity-60">{allCount}</span>}
        </Chip>
        {categories.map((c) => (
          <Chip key={c.category} active={filters.category === c.category} onClick={() => onChange({ category: c.category })}>
            <Icon name={categoryIcon(c.category)} className="h-4 w-4" />
            {c.category}
            <span className="text-xs opacity-60">{c.count}</span>
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-y border-stone-200 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{total}</span> result{total === 1 ? '' : 's'}
          </span>
          <span className="hidden h-5 w-px bg-slate-200 md:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Price</span>
            <DebouncedInput
              type="number"
              min="0"
              placeholder="Min"
              aria-label="Minimum price"
              value={filters.minPrice}
              onChange={(minPrice) => onChange({ minPrice })}
              className={`${inputClass} w-20`}
            />
            <span className="text-slate-400">–</span>
            <DebouncedInput
              type="number"
              min="0"
              placeholder="Max"
              aria-label="Maximum price"
              value={filters.maxPrice}
              onChange={(maxPrice) => onChange({ maxPrice })}
              className={`${inputClass} w-20`}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onChange({ inStock: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            In stock only
          </label>
          {hasFilters && (
            <button onClick={onReset} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm whitespace-nowrap text-slate-500">
            Sort by
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            className={`${inputClass} w-full md:w-48`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
