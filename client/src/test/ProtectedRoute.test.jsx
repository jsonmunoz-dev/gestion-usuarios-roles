import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { renderWithAuth } from './renderWithAuth';

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<p>Página de login</p>} />
      <Route path="/sin-permiso" element={<p>Sin permiso</p>} />
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<p>Zona admin</p>} />
      </Route>
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('redirige al login si no hay sesión', () => {
    renderWithAuth(routes(), { route: '/admin' });
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('redirige a "sin permiso" si el rol no está autorizado', () => {
    renderWithAuth(routes(), { route: '/admin', user: { id: 2, role: 'viewer' } });
    expect(screen.getByText('Sin permiso')).toBeInTheDocument();
  });

  it('muestra el contenido si el rol está autorizado', () => {
    renderWithAuth(routes(), { route: '/admin', user: { id: 1, role: 'admin' } });
    expect(screen.getByText('Zona admin')).toBeInTheDocument();
  });

  it('muestra un indicador mientras se recupera la sesión', () => {
    renderWithAuth(routes(), { route: '/admin', loading: true });
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });
});
