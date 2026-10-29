import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

// Renderiza con un contexto de auth falso para testear componentes aislados.
export function renderWithAuth(ui, { user = null, route = '/', loading = false, ...auth } = {}) {
  const value = {
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    ...auth,
  };
  return {
    auth: value,
    ...render(
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>,
    ),
  };
}
