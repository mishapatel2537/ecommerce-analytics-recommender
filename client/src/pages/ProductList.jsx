import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import SearchFilterBar, { DebouncedInput } from '../components/SearchFilterBar';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'name_asc';

// 1 … 4 5 [6] 7 8 … 12
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export default function ProductList() {
  const { user } = useAuth();

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

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const query = { ...filters, limit: PAGE_SIZE, inStock: filters.inStock || undefined };
    api
      .get('/products', { params: query })
      .then((res) => !cancelled && setResult(res.data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load products')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Any filter change resets to page 1; empty values are removed from the URL
  const updateFilters = useCallback(
    (changes) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === false || value == null || (key === 'sort' && value === DEFAULT_SORT)) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
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

  const goToPage = (page) => {
    updateFilters({ page: page > 1 ? page : '' });
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);
  const firstLoad = loading && !result;

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {totalProducts > 0 ? `${totalProducts} products across ${categories.length} categories` : 'Now open'}
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1]">
              {user ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Good things,'}
              <span className="block text-slate-400">{user ? 'What are you looking for today?' : 'thoughtfully chosen.'}</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              Tech, books, clothing, kitchen, fitness and beauty. Everyday essentials in one place, easy to search and filter.
            </p>

            <div className="relative mt-8 max-w-lg">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <label htmlFor="search" className="sr-only">
                Search products
              </label>
              <DebouncedInput
                id="search"
                type="search"
                placeholder="Search for a product…"
                value={filters.search}
                onChange={(search) => updateFilters({ search })}
                className="w-full rounded-xl border border-stone-300 bg-white py-3.5 pr-4 pl-12 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-stone-200 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">Popular:</span>
              {['Laptop', 'Coffee', 'Running', 'Yoga'].map((term) => (
                <button
                  key={term}
                  onClick={() => updateFilters({ search: term })}
                  className="rounded-md px-2 py-0.5 text-slate-700 underline decoration-stone-300 underline-offset-4 hover:decoration-slate-700"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <HeroCollage />
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-8 sm:px-6">
        <SearchFilterBar
          filters={filters}
          categories={categories}
          total={result?.total ?? 0}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        {error && (
          <div role="alert" className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <Icon name="alert" className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {!error && !loading && result?.products.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="search" className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-900">No products match your filters</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search or remove a filter.</p>
            <button
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div
          className={`mt-8 grid grid-cols-1 gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
            loading && result ? 'opacity-60' : ''
          }`}
        >
          {firstLoad
            ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
            : result?.products.map((p, i) => (
                <div key={p._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
        </div>

        {result?.pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
            <PageButton disabled={filters.page <= 1} onClick={() => goToPage(filters.page - 1)} aria-label="Previous page">
              <Icon name="chevronLeft" className="h-4 w-4" />
            </PageButton>
            {pageList(filters.page, result.pages).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="px-2 text-slate-400">
                  …
                </span>
              ) : (
                <PageButton key={p} active={p === filters.page} onClick={() => goToPage(p)} aria-current={p === filters.page ? 'page' : undefined}>
                  {p}
                </PageButton>
              )
            )}
            <PageButton disabled={filters.page >= result.pages} onClick={() => goToPage(filters.page + 1)} aria-label="Next page">
              <Icon name="chevronRight" className="h-4 w-4" />
            </PageButton>
          </nav>
        )}
      </section>
    </div>
  );
}

// Real product photos in a small editorial collage (hidden on small screens)
const HERO_ITEMS = [
  { name: 'Laptop Pro 14"', slug: 'laptop-pro-14', search: 'Laptop' },
  { name: 'Running Shoes', slug: 'running-shoes', search: 'Running' },
  { name: 'Coffee Maker', slug: 'coffee-maker', search: 'Coffee' },
];

function HeroCollage() {
  const [big, a, b] = HERO_ITEMS;
  const Tile = ({ item, className }) => (
    <Link
      to={`/?search=${encodeURIComponent(item.search)}`}
      className={`group relative block overflow-hidden rounded-2xl bg-stone-100 ${className}`}
    >
      <img
        src={`/products/${item.slug}.webp`}
        alt={item.name}
        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
      />
      <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm">
        {item.name}
      </span>
    </Link>
  );
  return (
    <div className="hidden h-[26rem] grid-cols-5 grid-rows-2 gap-3 lg:grid">
      <Tile item={big} className="col-span-3 row-span-2" />
      <Tile item={a} className="col-span-2" />
      <Tile item={b} className="col-span-2" />
    </div>
  );
}

function PageButton({ children, active, ...props }) {
  return (
    <button
      {...props}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-700 ring-1 ring-stone-200 hover:ring-stone-300 disabled:hover:ring-stone-200'
      }`}
    >
      {children}
    </button>
  );
}
