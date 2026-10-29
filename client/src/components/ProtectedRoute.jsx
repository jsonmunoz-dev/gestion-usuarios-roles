import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Protege rutas por sesión y, opcionalmente, por rol.
// La autorización real la hace la API; esto solo mejora la experiencia de uso.
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Cargando…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/sin-permiso" replace />;
  return <Outlet />;
}
