import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import FilterPanel, { ActiveFilters, SORT_OPTIONS } from '../components/FilterPanel';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import DebouncedInput from '../components/ui/DebouncedInput';
import Pagination from '../components/ui/Pagination';
import { Breadcrumbs } from '../components/ui/PageHeader';
import { EmptyState, ErrorState } from '../components/ui/States';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'name_asc';

// Remember whether the filter sidebar is hidden (desktop)
const SIDEBAR_KEY = 'shop:filters-hidden';
const readHidden = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
};

export default function ProductList() {
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(readHidden);

  // Filters live in the URL so a filtered view survives refresh and can be shared
  const [params, setParams] = useSearchParams();
  const filters = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      sort: params.get('sort') || DEFAULT_SORT,
      inStock: params.get('inStock') === 'true',
      page: Number(params.get('page')) || 1,
    }),
    [params]
  );

  const { data: catData } = useApi(() => api.get('/products/categories'), []);
  const categories = catData?.categories || [];

  const { data: result, error, loading, reload } = useApi(
    () => api.get('/products', { params: { ...filters, limit: PAGE_SIZE, inStock: filters.inStock || undefined } }),
    [filters],
    { fallback: 'Could not load products' }
  );

  // Any filter change resets to page 1; empty values are removed from the URL
  const updateFilters = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === false || value == null || (key === 'sort' && value === DEFAULT_SORT)) next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const resetFilters = () => setParams({}, { replace: true });

  const toggleSidebar = () =>
    setSidebarHidden((h) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, h ? '0' : '1');
      } catch {
        /* storage unavailable: just don't remember */
      }
      return !h;
    });

  const goToPage = (page) => {
    updateFilters({ page: page > 1 ? page : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterCount = [filters.category, filters.minPrice || filters.maxPrice, filters.inStock].filter(Boolean).length;
  const firstLoad = loading && !result;
  const from = result ? (filters.page - 1) * PAGE_SIZE + 1 : 0;
  const to = result ? Math.min(result.total, from + result.products.length - 1) : 0;
  const title = filters.category || (filters.search ? `Results for “${filters.search}”` : 'All products');

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6">
      {/* ---------- Header ---------- */}
      <header className="animate-fade-up border-b border-stone-200 pb-6">
        {user && <p className="mb-2 text-sm font-medium text-slate-500">Welcome back, {user.name.split(' ')[0]}. What are you after today?</p>}
        <Breadcrumbs
          items={[
            ...(user ? [] : [{ label: 'Home', to: '/' }]),
            { label: 'Shop', to: filters.category ? '/shop' : undefined },
            ...(filters.category ? [{ label: filters.category }] : []),
          ]}
        />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-500" aria-live="polite">
              {result ? (result.total ? `Showing ${from}–${to} of ${result.total} products` : 'No matching products') : 'Loading products…'}
            </p>
          </div>
          <div className="group relative w-full sm:w-80">
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
            <DebouncedInput
              id="shop-search"
              type="search"
              placeholder="Search products…"
              value={filters.search}
              onChange={(search) => updateFilters({ search })}
              className="field h-10 pl-10"
            />
          </div>
        </div>
      </header>

      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Desktop: hide / show the filter sidebar */}
          <Button
            variant="secondary"
            size="sm"
            icon="sliders"
            onClick={toggleSidebar}
            aria-expanded={!sidebarHidden}
            aria-controls="shop-filters"
            className="max-lg:hidden"
          >
            {sidebarHidden ? 'Show filters' : 'Hide filters'}
            {sidebarHidden && filterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">{filterCount}</span>
            )}
          </Button>
          {/* Mobile: filters open in a bottom sheet */}
          <Button variant="secondary" size="sm" icon="sliders" onClick={() => setSheetOpen(true)} className="lg:hidden">
            Filters
            {filterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">{filterCount}</span>}
          </Button>
          <ActiveFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm whitespace-nowrap text-slate-500 max-sm:sr-only">
            Sort by
          </label>
          <select id="sort" value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value })} className="field field-select h-9 w-auto py-0 font-medium">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- Sidebar + grid ---------- */}
      <div
        className={`grid transition-[grid-template-columns,column-gap] duration-300 ease-[var(--ease-snappy)] ${
          sidebarHidden ? 'lg:grid-cols-[0px_1fr] lg:gap-x-0' : 'lg:grid-cols-[240px_1fr] lg:gap-x-10'
        }`}
      >
        <aside
          id="shop-filters"
          aria-label="Filters"
          className={`hidden min-w-0 overflow-clip transition-opacity duration-200 lg:block ${sidebarHidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          inert={sidebarHidden ? '' : undefined}
        >
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] w-[240px] overflow-y-auto overscroll-contain rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card [scrollbar-width:thin]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
              {filterCount > 0 && (
                <button type="button" onClick={() => updateFilters({ category: '', minPrice: '', maxPrice: '', inStock: false })} className="text-xs font-semibold text-brand-700 hover:text-brand-900">
                  Reset
                </button>
              )}
            </div>
            <FilterPanel filters={filters} categories={categories} onChange={updateFilters} />
          </div>
        </aside>

        <div className="min-w-0">
          {error && !result ? (
            <ErrorState title="We couldn’t load the products" text={error} onRetry={reload} />
          ) : !loading && result?.products.length === 0 ? (
            <EmptyState
              icon="search"
              title="No products found"
              text="Nothing matches these filters. Try a different search or remove a filter."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-5 transition-opacity duration-200 min-[480px]:grid-cols-2 ${sidebarHidden ? 'lg:grid-cols-3 xl:grid-cols-4' : 'xl:grid-cols-3'} ${
                loading && result ? 'opacity-50' : ''
              }`}
              aria-busy={loading}
            >
              {firstLoad
                ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
                : result?.products.map((p, i) => (
                    <div key={p._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
            </div>
          )}

          {result?.pages > 1 && (
            <div className="mt-12">
              <Pagination page={filters.page} pages={result.pages} onChange={goToPage} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        variant="bottom"
        title="Filters"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={resetFilters}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              Show {result?.total ?? ''} results
            </Button>
          </div>
        }
      >
        <div className="px-5 py-5">
          <FilterPanel filters={filters} categories={categories} onChange={updateFilters} />
        </div>
      </Dialog>
    </div>
  );
}
