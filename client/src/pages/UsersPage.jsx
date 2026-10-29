import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const ROLES = ['admin', 'editor', 'viewer'];
const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer' };

export function UsersPage() {
  const { user: me, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/users?pageSize=100');
      setUsers(data.items);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      const detail = err.details?.map((d) => `${d.field}: ${d.message}`).join(' · ');
      setError(detail ? `${err.message} (${detail})` : err.message);
    }
  }

  const createUser = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/users', { method: 'POST', body: form });
      setForm(EMPTY_FORM);
    });
  };

  const changeRole = (id, role) =>
    run(() => api(`/users/${id}`, { method: 'PATCH', body: { role } }));

  const toggleActive = (u) =>
    run(() => api(`/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } }));

  const remove = (u) => {
    if (window.confirm(`¿Eliminar a ${u.name}?`)) {
      run(() => api(`/users/${u.id}`, { method: 'DELETE' }));
    }
  };

  return (
    <section className="card">
      <h1>Usuarios</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {isAdmin && (
        <form className="inline-form" onSubmit={createUser}>
          <input
            aria-label="Nombre"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            aria-label="Email"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            aria-label="Contraseña"
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            aria-label="Rol"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button type="submit">Crear usuario</button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isMe = u.id === me.id;
            return (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {isAdmin && !isMe ? (
                    <select
                      aria-label={`Rol de ${u.name}`}
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  )}
                </td>
                <td>{u.isActive ? 'Activo' : 'Inactivo'}</td>
                {isAdmin && (
                  <td className="actions">
                    {!isMe && (
                      <>
                        <button type="button" className="secondary" onClick={() => toggleActive(u)}>
                          {u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" className="danger" onClick={() => remove(u)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
