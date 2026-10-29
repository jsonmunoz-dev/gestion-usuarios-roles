import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { renderWithAuth } from './renderWithAuth';

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Inicio</p>} />
    </Routes>
  );
}

describe('LoginPage', () => {
  it('envía las credenciales y navega al inicio', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, role: 'admin' });
    renderWithAuth(routes(), { route: '/login', login });

    await userEvent.type(screen.getByLabelText('Email'), 'admin@demo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(login).toHaveBeenCalledWith('admin@demo.cl', 'Demo1234!');
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });

  it('muestra el error de la API', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'));
    renderWithAuth(routes(), { route: '/login', login });

    await userEvent.type(screen.getByLabelText('Email'), 'x@demo.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });
});

describe('LoginPage: acceso rápido de la demo', () => {
  it('inicia sesión con un clic usando la cuenta del rol elegido', async () => {
    const login = vi.fn().mockResolvedValue({ id: 2, role: 'editor' });
    renderWithAuth(routes(), { route: '/login', login });

    await userEvent.click(screen.getByRole('button', { name: /Entrar como Editor/ }));

    expect(login).toHaveBeenCalledWith('editor@demo.cl', 'Demo1234!');
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });
});
