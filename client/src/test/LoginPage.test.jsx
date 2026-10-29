import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';

// Contexto con estado real: al hacer login cambia "user", igual que AuthProvider.
function StatefulAuth({ loginImpl, children }) {
  const [user, setUser] = useState(null);
  const value = {
    user,
    loading: false,
    login: async (email, password) => {
      const u = await loginImpl(email, password);
      setUser(u);
      return u;
    },
    logout: vi.fn(),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function renderApp(route, loginImpl) {
  return render(
    <StatefulAuth loginImpl={loginImpl}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Inicio</p>} />
            <Route path="/usuarios" element={<p>Listado de usuarios</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </StatefulAuth>,
  );
}

describe('LoginPage', () => {
  it('envía las credenciales y navega al inicio', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, role: 'admin' });
    renderApp('/login', login);

    await userEvent.type(screen.getByLabelText('Email'), 'admin@demo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(login).toHaveBeenCalledWith('admin@demo.cl', 'Demo1234!');
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });

  it('vuelve a la página que se intentó abrir antes de iniciar sesión', async () => {
    const login = vi.fn().mockResolvedValue({ id: 2, role: 'editor' });
    renderApp('/usuarios', login);

    await userEvent.click(await screen.findByRole('button', { name: /Entrar como Editor/ }));

    expect(await screen.findByText('Listado de usuarios')).toBeInTheDocument();
  });

  it('muestra el error de la API', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'));
    renderApp('/login', login);

    await userEvent.type(screen.getByLabelText('Email'), 'x@demo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });

  it('inicia sesión con un clic usando la cuenta demo del rol elegido', async () => {
    const login = vi.fn().mockResolvedValue({ id: 3, role: 'viewer' });
    renderApp('/login', login);

    await userEvent.click(screen.getByRole('button', { name: /Entrar como Lector/ }));

    expect(login).toHaveBeenCalledWith('viewer@demo.cl', 'Demo1234!');
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });
});
