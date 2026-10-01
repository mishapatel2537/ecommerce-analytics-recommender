import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import Button, { IconButton } from './ui/Button';
import Dialog from './ui/Dialog';
import Menu, { MenuItem } from './ui/Menu';
import SegmentedControl from './ui/SegmentedControl';
import { Avatar, Logo } from './ui/Brand';
import { formatDate } from '../utils/format';

/**
 * Admin dashboard shell: collapsible dark sidebar + sticky top bar + panel grid.
 *
 *   <DashboardLayout title="..." filters={<DateRangeFilter ... />}>
 *     <DashboardPanel id="sales" title="Sales trend" icon="trendingUp" wide>...</DashboardPanel>
 *   </DashboardLayout>
 *
 * Panels sit in a 2-column grid on large screens; `wide` spans both columns.
 */

// Sidebar links jump to panels by id (and highlight while that panel is on screen)
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'sales', label: 'Sales analytics', icon: 'trendingUp' },
  { id: 'top-products', label: 'Products', icon: 'chart' },
  { id: 'segments', label: 'Customers', icon: 'users' },
  { id: 'inventory', label: 'Inventory', icon: 'cube' },
];

const COLLAPSE_KEY = 'dashboard:sidebar-collapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

/** Which section is currently in view */
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

function Sidebar({ collapsed = false, active, onNavigate, onToggle }) {
  const item = (isActive) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center' : ''} ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  // Hover label when the sidebar is collapsed
  const Tip = ({ children }) =>
    collapsed ? (
      <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-pop ring-1 ring-white/10 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {children}
      </span>
    ) : null;

  return (
    <div className="flex h-full flex-col bg-slate-950 px-3 py-5">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
        <Logo dark compact={collapsed} to="/admin" />
      </div>

      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto" aria-label="Dashboard">
        <div>
          {!collapsed && <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Analytics</div>}
          <ul className="mt-2 space-y-1">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={onNavigate} className={item(isActive)} aria-current={isActive ? 'true' : undefined}>
                    {isActive && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-brand-400" aria-hidden="true" />}
                    <Icon name={s.icon} className="h-5 w-5 shrink-0" />
                    {collapsed ? <span className="sr-only">{s.label}</span> : s.label}
                    <Tip>{s.label}</Tip>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          {!collapsed && <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Store</div>}
          <ul className="mt-2 space-y-1">
            <li>
              <Link to="/shop" className={item(false)} onClick={onNavigate}>
                <Icon name="store" className="h-5 w-5 shrink-0" />
                {collapsed ? <span className="sr-only">Storefront</span> : 'Storefront'}
                {!collapsed && <Icon name="arrowUpRight" className="ml-auto h-4 w-4 opacity-50" />}
                <Tip>Storefront</Tip>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/5 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Icon name={collapsed ? 'expand' : 'collapse'} className="h-5 w-5" />
          {!collapsed && 'Collapse'}
        </button>
      )}
    </div>
  );
}

export default function DashboardLayout({ title, subtitle, filters, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const active = useScrollSpy(SECTIONS.map((s) => s.id));

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* storage unavailable: just don't remember */
      }
      return !c;
    });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh bg-stone-50">
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 ease-[var(--ease-snappy)] lg:block ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        <Sidebar collapsed={collapsed} active={active} onToggle={toggle} />
      </aside>

      {/* Mobile drawer */}
      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} variant="left" hideHeader>
        <Sidebar active={active} onNavigate={() => setDrawerOpen(false)} />
      </Dialog>

      <div className={`transition-[padding] duration-300 ease-[var(--ease-snappy)] ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-8">
            <IconButton icon="menu" label="Open menu" className="lg:hidden" onClick={() => setDrawerOpen(true)} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
              {subtitle && <p className="hidden truncate text-sm text-slate-500 sm:block">{subtitle}</p>}
            </div>
            <div className="hidden xl:block">{filters}</div>
            {user && (
              <Menu
                label="Account menu"
                buttonClassName="gap-2 p-1 sm:pr-2"
                button={
                  <>
                    <Avatar name={user.name} className="h-8 w-8 text-xs" />
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                      <span className="block text-xs text-slate-500">Administrator</span>
                    </span>
                    <Icon name="chevronDown" className="hidden h-4 w-4 text-slate-400 sm:block" />
                  </>
                }
                header={
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                }
              >
                <MenuItem to="/shop" icon="store">
                  Storefront
                </MenuItem>
                <MenuItem to="/orders" icon="cube">
                  My orders
                </MenuItem>
                <div className="my-1.5 h-px bg-stone-100" />
                <MenuItem onClick={handleLogout} icon="logout" tone="danger">
                  Log out
                </MenuItem>
              </Menu>
            )}
          </div>
          {/* Filters get their own row below xl */}
          <div className="border-t border-stone-100 px-4 py-2.5 sm:px-8 xl:hidden">{filters}</div>
        </header>

        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardPanel({ id, title, description, icon, actions, wide = false, className = '', children }) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`min-w-0 scroll-mt-36 animate-fade-up rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-lift sm:p-6 xl:scroll-mt-24 ${
        wide ? 'lg:col-span-2' : ''
      } ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-slate-600 ring-1 ring-stone-200/80">
              <Icon name={icon} className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// Re-exported so existing panels keep importing it from here
export { SegmentedControl };

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

  const rangeText =
    value.from || value.to ? `${value.from ? formatDate(value.from) : 'Start'} – ${value.to ? formatDate(value.to) : 'Today'}` : 'All time';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="hidden items-center gap-1.5 text-sm text-slate-500 2xl:flex">
        <Icon name="calendar" className="h-4 w-4" /> {rangeText}
      </span>
      <div className="scrollbar-none max-w-full overflow-x-auto">
        <SegmentedControl label="Date range" options={PRESETS} value={value.preset} onChange={selectPreset} />
      </div>
      {value.preset === 'custom' && (
        <form onSubmit={applyCustom} className="flex animate-fade-in flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="From date"
            value={custom.from}
            max={custom.to || undefined}
            onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            className="field h-9 w-auto py-0"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            aria-label="To date"
            value={custom.to}
            min={custom.from || undefined}
            onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            className="field h-9 w-auto py-0"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      )}
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  );
}
