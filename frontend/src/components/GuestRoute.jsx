import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner label="Verificando sesión..." />;
  }

  if (isAuthenticated) {
    const target = location.state?.from?.pathname || '/profile';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
