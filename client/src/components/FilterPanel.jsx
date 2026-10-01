import Icon, { categoryIcon } from './Icon';
import DebouncedInput from './ui/DebouncedInput';

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

// Shortcuts that just fill in the min / max price filters the API already supports
const PRICE_RANGES = [
  { label: 'Up to $25', min: '', max: '25' },
  { label: '$25 – $100', min: '25', max: '100' },
  { label: '$100 – $500', min: '100', max: '500' },
  { label: '$500 & up', min: '500', max: '' },
];

function Section({ title, children }) {
  return (
    <div role="group" aria-label={title} className="border-b border-stone-200 py-5 first:pt-0 last:border-0">
      <h3 className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</h3>
      {children}
    </div>
  );
}

/** Switch styled checkbox */
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-snappy)] peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/**
 * Category / price / availability filters. Used as the desktop sidebar and
 * inside the mobile filter sheet. filters + onChange(partial) come from the URL.
 */
export default function FilterPanel({ filters, categories, onChange }) {
  const allCount = categories.reduce((sum, c) => sum + c.count, 0);
  const options = [{ category: '', label: 'All products', count: allCount, icon: 'grid' }].concat(
    categories.map((c) => ({ ...c, label: c.category, icon: categoryIcon(c.category) }))
  );

  return (
    <div>
      <Section title="Category">
        <ul className="-mx-2 space-y-0.5">
          {options.map((c) => {
            const active = filters.category === c.category;
            return (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => onChange({ category: c.category })}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                    active ? 'bg-slate-900 font-semibold text-white shadow-sm' : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                  }`}
                >
                  <Icon name={c.icon} className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.count > 0 && <span className={`text-xs tabular-nums ${active ? 'text-white/70' : 'text-slate-400'}`}>{c.count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Price">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">$</span>
            <DebouncedInput
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="Min"
              aria-label="Minimum price"
              value={filters.minPrice}
              onChange={(minPrice) => onChange({ minPrice })}
              className="field h-10 pl-7"
            />
          </div>
          <span className="text-slate-300">–</span>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-400">$</span>
            <DebouncedInput
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="Max"
              aria-label="Maximum price"
              value={filters.maxPrice}
              onChange={(maxPrice) => onChange({ maxPrice })}
              className="field h-10 pl-7"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((r) => {
            const active = filters.minPrice === r.min && filters.maxPrice === r.max;
            return (
              <button
                key={r.label}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(active ? { minPrice: '', maxPrice: '' } : { minPrice: r.min, maxPrice: r.max })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-stone-200 hover:text-slate-900 hover:ring-stone-300'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Availability">
        <Toggle checked={filters.inStock} onChange={(inStock) => onChange({ inStock })} label="In stock only" description="Hide sold-out products" />
      </Section>
    </div>
  );
}

/** Removable pills for every active filter */
export function ActiveFilters({ filters, onChange, onReset }) {
  const chips = [];
  if (filters.search) chips.push({ key: 'search', label: `“${filters.search}”`, clear: { search: '' } });
  if (filters.category) chips.push({ key: 'category', label: filters.category, clear: { category: '' } });
  if (filters.minPrice || filters.maxPrice) {
    const label = filters.minPrice && filters.maxPrice ? `$${filters.minPrice} – $${filters.maxPrice}` : filters.minPrice ? `From $${filters.minPrice}` : `Up to $${filters.maxPrice}`;
    chips.push({ key: 'price', label, clear: { minPrice: '', maxPrice: '' } });
  }
  if (filters.inStock) chips.push({ key: 'stock', label: 'In stock', clear: { inStock: false } });
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.clear)}
          aria-label={`Remove filter ${c.label}`}
          className="group flex animate-scale-in items-center gap-1.5 rounded-full bg-white py-1 pr-2 pl-3 text-xs font-medium text-slate-700 shadow-card ring-1 ring-stone-200 transition hover:ring-stone-300"
        >
          {c.label}
          <Icon name="close" className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-rose-600" />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={onReset} className="px-1 text-xs font-semibold text-brand-700 hover:text-brand-900">
          Clear all
        </button>
      )}
    </div>
  );
}
