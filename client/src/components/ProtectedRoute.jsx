import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * <Route element={<ProtectedRoute />}>            logged-in users
 * <Route element={<ProtectedRoute adminOnly />}>  admins only
 */
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}
