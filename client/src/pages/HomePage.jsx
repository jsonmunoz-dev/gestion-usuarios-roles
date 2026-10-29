import { useAuth } from '../auth/AuthContext';

const PERMISSIONS = {
  admin: ['Ver tu perfil', 'Listar usuarios', 'Crear, editar y eliminar usuarios'],
  editor: ['Ver tu perfil', 'Listar usuarios'],
  viewer: ['Ver tu perfil'],
};

export function HomePage() {
  const { user } = useAuth();
  return (
    <section className="card">
      <h1>Hola, {user.name}</h1>
      <p>
        Tu rol es <strong>{user.role}</strong>. Con este rol puedes:
      </p>
      <ul>
        {PERMISSIONS[user.role].map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  );
}
