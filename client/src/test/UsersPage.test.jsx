import { screen } from '@testing-library/react';
import { UsersPage } from '../pages/UsersPage';
import { renderWithAuth } from './renderWithAuth';

const users = [
  { id: 1, name: 'Ana Admin', email: 'admin@demo.cl', role: 'admin', isActive: true },
  { id: 2, name: 'Valeria Viewer', email: 'viewer@demo.cl', role: 'viewer', isActive: true },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: users, page: 1, pageSize: 100, total: 2 }),
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('UsersPage', () => {
  it('admin ve el formulario de creación y las acciones', async () => {
    renderWithAuth(<UsersPage />, { user: users[0] });
    expect(await screen.findByText('Valeria Viewer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    // El admin no puede editar su propia fila.
    expect(screen.queryByLabelText('Rol de Ana Admin')).not.toBeInTheDocument();
  });

  it('editor solo ve el listado, sin acciones', async () => {
    renderWithAuth(<UsersPage />, { user: { id: 3, name: 'Editor', role: 'editor' } });
    expect(await screen.findByText('Valeria Viewer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear usuario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });
});
