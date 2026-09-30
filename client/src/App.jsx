import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar, { Logo } from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Dashboard pulls in the charting library, so load it only when an admin opens it
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// These pages bring their own full-screen layout (no storefront navbar / footer)
const FULL_SCREEN = ['/login', '/signup', '/admin'];

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <span className="text-7xl font-semibold tracking-tight text-slate-300">404</span>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">This page doesn’t exist (yet).</p>
      <Link to="/" className="mt-8 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
        Back to shop
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="text-sm text-slate-500">MERN mini project · Web Development + Advanced DBMS</p>
      </div>
    </footer>
  );
}

function Shell({ children }) {
  const { pathname } = useLocation();
  const fullScreen = FULL_SCREEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (fullScreen) return children;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* Person B: wrap with <CartProvider> here */}
      <Shell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Register pages here: one line per route. */}
            {/* Person A */}
            <Route path="/" element={<ProductList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            {/* Person B: /products/:id, /cart, /checkout (logged in), /orders (logged in) */}
            {/* Person C: review / also-bought sections live inside ProductDetail */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Shell>
    </AuthProvider>
  );
}
