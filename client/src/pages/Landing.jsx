import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductCard, { ProductCardSkeleton, ProductImage, RatingInline } from '../components/ProductCard';
import Icon, { categoryIcon } from '../components/Icon';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import useApi from '../hooks/useApi';
import { homeFor, useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Button';
import { formatPrice } from '../utils/format';

const POPULAR = ['Laptop', 'Coffee', 'Running', 'Yoga'];
// Old links put shop filters on "/" (e.g. /?search=lap); those now live on /shop
const SHOP_PARAMS = ['search', 'category', 'minPrice', 'maxPrice', 'sort', 'inStock', 'page'];

const STEPS = [
  { icon: 'user', title: 'Create your account', text: 'Sign up in seconds. Your cart and orders are saved to your account.' },
  { icon: 'search', title: 'Find what you need', text: 'Search, filter by category, price and stock, and read real reviews.' },
  { icon: 'truck', title: 'Check out & track', text: 'Place your order in one click, then follow it from placed to delivered.' },
];

const INSIGHTS = [
  { icon: 'trendingUp', title: 'Sales trend', text: 'Monthly revenue and orders with period-over-period comparison.' },
  { icon: 'trophy', title: 'Top products', text: 'Best sellers ranked by units or revenue for any date range.' },
  { icon: 'users', title: 'Customer segments', text: 'Spend tiers built with $group and $bucket aggregation.' },
  { icon: 'sparkles', title: 'Customers also bought', text: 'Co-purchase pairs mined from real order history.' },
];

const FAQ = [
  { q: 'Is the payment real?', a: 'No. This is a demo store: placing an order records it and updates stock, but no money is taken.' },
  { q: 'How are “Customers also bought” suggestions made?', a: 'A MongoDB aggregation looks at past orders that contain a product and counts which other products appear in the same orders.' },
  { q: 'Who can see the analytics dashboard?', a: 'Only admin accounts. Customers who sign up get the shop, cart, checkout and their own order history.' },
  { q: 'Can I leave a review?', a: 'Yes. Once you’re logged in you can rate and review any product, once per product.' },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchRef = useRef(null);
  const [query, setQuery] = useState('');

  const { data: catData } = useApi(() => api.get('/products/categories'), []);
  const categories = catData?.categories || [];
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);
  const { data: newest, error: newestError } = useApi(() => api.get('/products', { params: { sort: 'newest', limit: 4 } }), []);

  // Press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const params = new URLSearchParams(search);
  if (SHOP_PARAMS.some((k) => params.has(k))) return <Navigate to={`/shop${search}`} replace />;

  // The landing page is for visitors. Logged-in users go straight to their dashboard.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400" role="status" aria-label="Loading">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (user) return <Navigate to={homeFor(user)} replace />;

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  // Landing -> login -> dashboard
  const ctas = (
    <>
      <Button to="/signup" size="lg" iconRight="arrowRight">
        Get started free
      </Button>
      <Button to="/login" size="lg" variant="secondary" icon="user">
        Log in
      </Button>
    </>
  );

  return (
    <div className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative border-b border-stone-200 bg-white">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-card ring-1 ring-stone-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {totalProducts > 0 ? `${totalProducts} products across ${categories.length} categories` : 'Store is open'}
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl sm:leading-[1.06] lg:text-[3.6rem]">
              Everyday essentials,
              <span className="block text-slate-400">thoughtfully chosen.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              Tech, books, clothing, kitchen, fitness and beauty in one place, with smart search, honest reviews and suggestions based on what
              people really buy together.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">{ctas}</div>

            <form role="search" onSubmit={submit} className="group relative mt-8 max-w-xl">
              <label htmlFor="hero-search" className="sr-only">
                Search products
              </label>
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600"
              />
              <input
                ref={searchRef}
                id="hero-search"
                type="search"
                placeholder="Or search for a product…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field h-13 rounded-2xl pr-24 pl-12 text-base"
              />
              <Button type="submit" size="sm" variant="ghost" className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-stone-100">
                Search
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">Popular:</span>
              {POPULAR.map((term) => (
                <Link
                  key={term}
                  to={`/shop?search=${encodeURIComponent(term)}`}
                  className="rounded-full bg-stone-100 px-3 py-1 text-sm text-slate-700 transition hover:bg-stone-200"
                >
                  {term}
                </Link>
              ))}
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-stone-200 pt-6">
              <HeroStat label="Products" value={totalProducts || '–'} />
              <HeroStat label="Categories" value={categories.length || '–'} />
              <HeroStat label="Shipping" value="Free" />
            </dl>
          </div>

          <HeroCollage featured={newest?.products?.[0]} />
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading eyebrow="How it works" title="From browsing to delivered in three steps" />
        <ol className="relative grid gap-5 md:grid-cols-3">
          <span className="absolute top-10 right-[16%] left-[16%] hidden h-px border-t border-dashed border-stone-300 md:block" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 100} className="group relative rounded-2xl border border-stone-200/80 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-transform duration-300 group-hover:-rotate-6">
                  <Icon name={s.icon} className="h-5.5 w-5.5" />
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Step {i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading eyebrow="Categories" title="Shop by category" link={{ to: '/shop', label: 'Browse all products' }} />
          <CategoryTiles categories={categories} />
        </div>
      </section>

      {/* ---------- Analytics showcase ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-slate-950 p-8 sm:p-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold tracking-wider text-brand-300 uppercase">Behind the store</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">Every sale feeds a live analytics dashboard.</h2>
            <p className="mt-4 max-w-md leading-relaxed text-slate-400">
              Admins see what’s selling, who’s buying and what gets bought together, all computed on the fly with MongoDB aggregation pipelines.
            </p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {INSIGHTS.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
                    <Icon name={f.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{f.title}</span>
                    <span className="block text-sm text-slate-400">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DashboardIllustration />
        </Reveal>
      </section>

      {/* ---------- New arrivals ---------- */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading eyebrow="Just in" title="New arrivals" link={{ to: '/shop?sort=newest', label: 'See all new products' }} />
          {newestError ? (
            <p className="text-sm text-slate-500">New arrivals couldn’t be loaded right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {!newest
                ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
                : newest.products.map((p, i) => (
                    <Reveal key={p._id} delay={i * 60} className="h-full">
                      <ProductCard product={p} />
                    </Reveal>
                  ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:py-24">
        <div>
          <p className="text-xs font-semibold tracking-wider text-brand-600 uppercase">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Questions, answered</h2>
          <p className="mt-2 text-slate-500">The short version of how this store works.</p>
        </div>
        <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200/80 bg-white shadow-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 sm:px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold text-slate-900 transition hover:text-brand-700">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-500 transition duration-300 group-open:rotate-45 group-open:bg-slate-900 group-open:text-white">
                  <Icon name="plus" className="h-4 w-4" />
                </span>
              </summary>
              <p className="-mt-1 animate-fade-in pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Call to action ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Reveal className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-brand-600 px-8 py-10 sm:flex-row sm:items-center sm:px-12">
          <span className="bg-dots pointer-events-none absolute inset-0 opacity-30 invert" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ready to find something good?</h2>
            <p className="mt-2 text-brand-100">Create a free account to save your cart and track your orders.</p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Button to="/signup" variant="inverse" size="lg" iconRight="arrowRight">
              Get started free
            </Button>
            <Button to="/login" size="lg" className="bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">
              Log in
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, link }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-wider text-brand-600 uppercase">{eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-slate-900 sm:text-3xl">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="group flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
          {link.label}
          <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}

/** One tile per category, with the photo of a real product from it */
function CategoryTiles({ categories }) {
  const [covers, setCovers] = useState({});

  useEffect(() => {
    if (!categories.length) return undefined;
    let cancelled = false;
    Promise.all(
      categories.map((c) =>
        api
          .get('/products', { params: { category: c.category, limit: 1 } })
          .then((r) => [c.category, r.data.products[0]])
          .catch(() => [c.category, null])
      )
    ).then((pairs) => !cancelled && setCovers(Object.fromEntries(pairs)));
    return () => {
      cancelled = true;
    };
  }, [categories]);

  if (!categories.length) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((c, i) => (
        <Reveal as="li" key={c.category} delay={i * 50}>
          <Link
            to={`/shop?category=${encodeURIComponent(c.category)}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200 shadow-card ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            {covers[c.category] && <ProductImage product={covers[c.category]} className="absolute inset-0 h-full w-full group-hover:scale-[1.06]" />}
            <span className="absolute inset-0 bg-slate-950/30 transition group-hover:bg-slate-950/40" aria-hidden="true" />
            <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl bg-white/95 p-3 shadow-sm backdrop-blur">
              <span className="min-w-0">
                <span className="flex items-start gap-2 text-sm leading-tight font-semibold text-slate-900">
                  <Icon name={categoryIcon(c.category)} className="mt-px h-4 w-4 shrink-0 text-slate-500" />
                  <span>{c.category}</span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{c.count} products</span>
              </span>
              <Icon name="arrowRight" className="h-4 w-4 shrink-0 -translate-x-1 text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

// Real product photos in an editorial collage (desktop only), with floating cards
const HERO_ITEMS = [
  { name: 'Laptop Pro 14"', slug: 'laptop-pro-14', search: 'Laptop' },
  { name: 'Running Shoes', slug: 'running-shoes', search: 'Running' },
  { name: 'Coffee Maker', slug: 'coffee-maker', search: 'Coffee' },
];

function HeroCollage({ featured }) {
  const [big, a, b] = HERO_ITEMS;
  const Tile = ({ item, className, delay }) => (
    <Link
      to={`/shop?search=${encodeURIComponent(item.search)}`}
      className={`group relative block animate-fade-up overflow-hidden rounded-3xl bg-stone-100 shadow-lift ring-1 ring-stone-200/70 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <img
        src={`/products/${item.slug}.webp`}
        alt={item.name}
        className="h-full w-full object-cover transition duration-700 ease-[var(--ease-snappy)] group-hover:scale-[1.05]"
      />
      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pr-2.5 pl-3 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition group-hover:pr-2">
        {item.name}
        <Icon name="arrowRight" className="h-3.5 w-0 opacity-0 transition-all duration-300 group-hover:w-3.5 group-hover:opacity-100" />
      </span>
    </Link>
  );
  return (
    <div className="relative hidden lg:block" aria-label="Featured searches">
      <div className="grid h-[31rem] grid-cols-5 grid-rows-2 gap-4">
        <Tile item={big} className="col-span-3 row-span-2" delay={80} />
        <Tile item={a} className="col-span-2" delay={160} />
        <Tile item={b} className="col-span-2" delay={240} />
      </div>

      {/* Newest product, from the API */}
      {featured && (
        <Link
          to={`/products/${featured._id}`}
          className="absolute -bottom-8 -left-10 flex w-64 animate-fade-up items-center gap-3 rounded-2xl bg-white p-3 shadow-pop ring-1 ring-stone-200/80 transition hover:-translate-y-1 [animation-delay:400ms]"
        >
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
            <ProductImage product={featured} className="h-full w-full" />
          </span>
          <span className="min-w-0">
            <span className="text-[11px] font-semibold tracking-wider text-brand-600 uppercase">New in</span>
            <span className="block truncate text-sm font-semibold text-slate-900">{featured.name}</span>
            <span className="mt-0.5 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatPrice(featured.price)}</span>
              <RatingInline productId={featured._id} size={11} />
            </span>
          </span>
        </Link>
      )}

      <span className="absolute -top-5 -right-4 flex animate-fade-up items-center gap-2 rounded-full bg-slate-900 py-2 pr-4 pl-2 text-sm font-semibold text-white shadow-pop [animation-delay:500ms]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <Icon name="truck" className="h-4 w-4" />
        </span>
        Free shipping
      </span>
    </div>
  );
}

/** Decorative sketch of the admin dashboard: shapes only, no numbers */
function DashboardIllustration() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 sm:p-5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 h-2 w-24 rounded-full bg-white/10" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[0.7, 0.5, 0.85].map((w, i) => (
            <div key={i} className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/5">
              <span className="block h-1.5 w-1/2 rounded-full bg-white/15" />
              <span className="mt-3 block h-3 rounded-full bg-white/70" style={{ width: `${w * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/5">
          <svg viewBox="0 0 300 110" className="h-32 w-full" fill="none">
            {[20, 50, 80].map((y) => (
              <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgb(255 255 255 / 0.07)" />
            ))}
            <path d="M0 88 C30 80 45 60 75 64 S120 92 150 70 S200 22 225 30 S270 60 300 18" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" className="dash-draw" />
            <path d="M0 96 C40 94 60 84 90 86 S140 90 170 80 S230 66 300 58" stroke="rgb(255 255 255 / 0.25)" strokeWidth="1.5" strokeDasharray="4 5" />
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">
          <div className="space-y-2.5 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/5">
            {[0.92, 0.74, 0.6, 0.45].map((w, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-5 w-5 shrink-0 rounded-md bg-white/10" />
                <span className="block h-2 rounded-full bg-brand-400/80" style={{ width: `${w * 100}%` }} />
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/5">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
              <circle cx="18" cy="18" r="14" stroke="#c7d2fe" strokeWidth="5" strokeDasharray="44 100" fill="none" pathLength="100" />
              <circle cx="18" cy="18" r="14" stroke="#818cf8" strokeWidth="5" strokeDasharray="30 100" strokeDashoffset="-45" fill="none" pathLength="100" />
              <circle cx="18" cy="18" r="14" stroke="#4f46e5" strokeWidth="5" strokeDasharray="15 100" strokeDashoffset="-76" fill="none" pathLength="100" />
              <circle cx="18" cy="18" r="14" stroke="#a5b4fc" strokeWidth="5" strokeDasharray="7 100" strokeDashoffset="-92" fill="none" pathLength="100" />
            </svg>
          </div>
        </div>
      </div>
      <span className="absolute -right-3 -bottom-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-pop">Admin dashboard preview</span>
    </div>
  );
}
