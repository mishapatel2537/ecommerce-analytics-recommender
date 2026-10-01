import { lazy, Suspense, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import CartDrawer from './components/CartDrawer';
import Button, { Spinner } from './components/ui/Button';
import { Logo } from './components/ui/Brand';

// Dashboard pulls in the charting library, so load it only when an admin opens it
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// These pages bring their own full-screen layout (no storefront navbar / footer)
const FULL_SCREEN = ['/login', '/signup', '/admin'];

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-400" role="status" aria-label="Loading page">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <span className="text-8xl font-semibold tracking-tighter text-stone-200">404</span>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you’re looking for doesn’t exist or has moved.</p>
      <Button to="/shop" icon="arrowLeft" className="mt-8">
        Back to shop
      </Button>
    </div>
  );
}

function Footer() {
  const { user, isAdmin } = useAuth();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            A MERN store with a BI dashboard built on MongoDB aggregation pipelines.
          </p>
        </div>
        <FooterCol title="Shop" links={[['All products', '/shop'], ...(user ? [['Your cart', '/cart']] : [])]} />
        <FooterCol
          title="Account"
          links={
            user
              ? [['Order history', '/orders'], ...(isAdmin ? [['Admin dashboard', '/admin']] : [])]
              : [
                  ['Log in', '/login'],
                  ['Create account', '/signup'],
                ]
          }
        />
      </div>
      <div className="border-t border-stone-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} E-commerce Analytics · Web Development + Advanced DBMS mini project</p>
          <p>Demo store: no real payments are taken.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-slate-500 transition hover:text-slate-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Start each new page at the top (filters on the same page keep their position)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function Shell({ children }) {
  const { pathname } = useLocation();
  const fullScreen = FULL_SCREEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  // Keyed by path so each page fades in on navigation
  const page = (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
  if (fullScreen) return page;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {page}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <ScrollToTop />
          <Shell>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Register pages here: one line per route. */}
                {/* Person A */}
                <Route path="/" element={<Landing />} />
                <Route path="/shop" element={<ProductList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
                {/* Person B */}
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<OrderHistory />} />
                </Route>
                {/* Person C: review / also-bought sections live inside ProductDetail */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Shell>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
