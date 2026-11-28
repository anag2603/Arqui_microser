import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, sessionEndReason } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner label="Verificando sesión..." />;
  }

  if (!isAuthenticated) {
    if (sessionEndReason) {
      return <Navigate to="/session-expired" replace />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
