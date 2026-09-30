import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import ProductCard from '../components/ProductCard';
import SearchFilterBar from '../components/SearchFilterBar';

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'name_asc';

export default function ProductList() {
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
  const [result, setResult] = useState({ products: [], total: 0, pages: 1 });
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

  const goToPage = (page) => {
    updateFilters({ page: page > 1 ? page : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${result.total} product${result.total === 1 ? '' : 's'} found`}
        </p>
      </div>

      <SearchFilterBar
        filters={filters}
        categories={categories}
        onChange={updateFilters}
        onReset={() => setParams({}, { replace: true })}
      />

      {error && (
        <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && !loading && result.products.length === 0 && (
        <div className="mt-12 text-center text-gray-500">
          <p className="text-lg font-medium">No products match your filters.</p>
          <button onClick={() => setParams({}, { replace: true })} className="mt-2 text-sm text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      <div
        className={`mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity ${
          loading ? 'opacity-50' : ''
        }`}
      >
        {result.products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      {result.pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          <PageButton disabled={filters.page <= 1} onClick={() => goToPage(filters.page - 1)}>
            Previous
          </PageButton>
          <span className="px-3 text-sm text-gray-600">
            Page {filters.page} of {result.pages}
          </span>
          <PageButton disabled={filters.page >= result.pages} onClick={() => goToPage(filters.page + 1)}>
            Next
          </PageButton>
        </nav>
      )}
    </div>
  );
}

function PageButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
