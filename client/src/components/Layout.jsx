import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <strong>Gestión de Usuarios</strong>
        <nav>
          <NavLink to="/">Inicio</NavLink>
          {hasRole('admin', 'editor') && <NavLink to="/usuarios">Usuarios</NavLink>}
        </nav>
        <div className="session">
          <span>
            {user.name} <span className={`badge badge-${user.role}`}>{user.role}</span>
          </span>
          <button type="button" className="secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
