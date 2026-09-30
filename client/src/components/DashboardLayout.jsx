import { useState } from 'react';

/**
 * Admin dashboard shell.
 *
 *   <DashboardLayout title="..." filters={<DateRangeFilter ... />}>
 *     <DashboardPanel title="Sales trend" wide>...</DashboardPanel>
 *     <DashboardPanel title="Top products">...</DashboardPanel>
 *   </DashboardLayout>
 *
 * Panels sit in a 2-column grid on large screens; `wide` spans both columns.
 */
export default function DashboardLayout({ title, subtitle, filters, children }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {filters}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
    </div>
  );
}

export function DashboardPanel({ title, description, actions, wide = false, children }) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${wide ? 'lg:col-span-2' : ''}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// Small segmented toggle used by panels (e.g. Revenue / Orders, Chart / Table)
export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-md px-3 py-1 text-sm font-medium transition ${
            value === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Date range filter (applies to every panel) ----------

const PRESETS = [
  { value: '3m', label: '3M', months: 3 },
  { value: '6m', label: '6M', months: 6 },
  { value: '12m', label: '12M', months: 12 },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' },
];

const toISODate = (d) => d.toISOString().slice(0, 10);

// Last N calendar months including the current one, e.g. 3M on 30 Sep -> 1 Jul .. today
export function rangeForPreset(preset) {
  const p = PRESETS.find((x) => x.value === preset);
  if (!p?.months) return { preset, from: '', to: '' };
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (p.months - 1), 1));
  return { preset, from: toISODate(from), to: toISODate(now) };
}

/** value: { preset, from, to } (dates as YYYY-MM-DD, '' = open-ended) */
export function DateRangeFilter({ value, onChange }) {
  const [custom, setCustom] = useState({ from: value.from, to: value.to });
  const [error, setError] = useState('');

  const selectPreset = (preset) => {
    setError('');
    if (preset === 'custom') {
      setCustom({ from: value.from, to: value.to });
      onChange({ ...value, preset: 'custom' });
    } else {
      onChange(rangeForPreset(preset));
    }
  };

  const applyCustom = (e) => {
    e.preventDefault();
    if (custom.from && custom.to && custom.from > custom.to) {
      setError('Start date must be before end date');
      return;
    }
    setError('');
    onChange({ preset: 'custom', from: custom.from, to: custom.to });
  };

  const dateInput =
    'rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none';

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <SegmentedControl label="Date range" options={PRESETS} value={value.preset} onChange={selectPreset} />
      {value.preset === 'custom' && (
        <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="From date"
            value={custom.from}
            onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            className={dateInput}
          />
          <span className="text-sm text-gray-500">to</span>
          <input
            type="date"
            aria-label="To date"
            value={custom.to}
            onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            className={dateInput}
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">
            Apply
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
