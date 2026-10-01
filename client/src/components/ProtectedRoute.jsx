import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { Spinner } from './ui/Button';

/**
 * <Route element={<ProtectedRoute />}>            logged-in users
 * <Route element={<ProtectedRoute adminOnly />}>  admins only
 */
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400" role="status" aria-label="Loading">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return children ?? <Outlet />;
}
