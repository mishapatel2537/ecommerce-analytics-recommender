import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './pages/ProductList';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Dashboard pulls in the charting library, so load it only when an admin opens it
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">This page doesn't exist (yet).</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to products
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* Person B: wrap with <CartProvider> here */}
      <Navbar />
      <main>
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
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
      </main>
    </AuthProvider>
  );
}
