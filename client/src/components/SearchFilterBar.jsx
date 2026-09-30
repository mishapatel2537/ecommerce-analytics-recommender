import { useEffect, useState } from 'react';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none';

// Text input that reports its value after the user stops typing
function DebouncedInput({ value, onChange, delay = 350, ...props }) {
  const [text, setText] = useState(value);

  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const id = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(id);
  }, [text, value, delay, onChange]);

  return <input {...props} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} />;
}

/**
 * filters: { search, category, minPrice, maxPrice, sort, inStock }
 * onChange(partialFilters)
 */
export default function SearchFilterBar({ filters, categories, onChange, onReset }) {
  const hasFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-12">
        <div className="col-span-2 md:col-span-4">
          <label className="sr-only" htmlFor="search">
            Search products
          </label>
          <DebouncedInput
            id="search"
            type="search"
            placeholder="Search products…"
            value={filters.search}
            onChange={(search) => onChange({ search })}
          />
        </div>

        <div className="col-span-2 md:col-span-3">
          <label className="sr-only" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={inputClass}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <DebouncedInput
            type="number"
            min="0"
            placeholder="Min $"
            aria-label="Minimum price"
            value={filters.minPrice}
            onChange={(minPrice) => onChange({ minPrice })}
          />
        </div>
        <div className="md:col-span-1">
          <DebouncedInput
            type="number"
            min="0"
            placeholder="Max $"
            aria-label="Maximum price"
            value={filters.maxPrice}
            onChange={(maxPrice) => onChange({ maxPrice })}
          />
        </div>

        <div className="col-span-2 md:col-span-3">
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select id="sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} className={inputClass}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          In stock only
        </label>
        {hasFilters && (
          <button onClick={onReset} className="text-sm font-medium text-blue-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
