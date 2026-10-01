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
    return (
      <div className="flex min-h-[60vh] items-center justify-center" aria-label="Loading">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}
