import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { Avatar, Logo } from './Navbar';

/**
 * Admin dashboard shell: dark sidebar + sticky top bar + panel grid.
 *
 *   <DashboardLayout title="..." filters={<DateRangeFilter ... />}>
 *     <DashboardPanel id="sales" title="Sales trend" icon="trendingUp" wide>...</DashboardPanel>
 *     <DashboardPanel id="top-products" title="Top products" icon="chart">...</DashboardPanel>
 *   </DashboardLayout>
 *
 * Panels sit in a 2-column grid on large screens; `wide` spans both columns.
 */

// Sidebar "Analytics" links jump to panels by id. Persons B / C: keep these ids on your panels.
const SECTIONS = [
  { href: '#sales', label: 'Sales trend', icon: 'trendingUp' },
  { href: '#top-products', label: 'Top products', icon: 'chart' },
  { href: '#segments', label: 'Customer segments', icon: 'users' },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="flex h-full flex-col bg-slate-950 px-4 py-5">
      <div className="px-2">
        <Logo dark />
      </div>

      <nav className="mt-8 flex-1 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <NavLink to="/admin" end className={item} onClick={onNavigate}>
            <Icon name="grid" className="h-5 w-5" /> Overview
          </NavLink>
          <NavLink to="/" end className={item} onClick={onNavigate}>
            <Icon name="store" className="h-5 w-5" /> Storefront
          </NavLink>
        </div>

        <div>
          <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Analytics</div>
          <div className="mt-2 space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <Icon name={s.icon} className="h-5 w-5" /> {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {user && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <Avatar name={user.name} className="h-9 w-9 text-xs ring-slate-950" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user.name}</div>
            <div className="truncate text-xs text-slate-400">{user.email}</div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ title, subtitle, filters, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Icon name="menu" className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
            {filters}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardPanel({ id, title, description, icon, actions, wide = false, children }) {
  return (
    <section
      id={id}
      className={`min-w-0 scroll-mt-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${wide ? 'lg:col-span-2' : ''}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-slate-600 ring-1 ring-stone-200">
              <Icon name={icon} className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// Segmented toggle used by panels (e.g. Revenue / Orders, Chart / Table)
export function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
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
  { value: 'custom', label: 'Custom', icon: 'calendar' },
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
    'rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:ring-4 focus:ring-stone-200 focus:outline-none';

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
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            aria-label="To date"
            value={custom.to}
            onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            className={dateInput}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Apply
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
