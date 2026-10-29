import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Cuentas de la demo pública (se reinician cada día).
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  { email: 'admin@demo.cl', label: 'Administrador', description: 'Crea, edita y elimina usuarios' },
  { email: 'editor@demo.cl', label: 'Editor', description: 'Ve el listado de usuarios' },
  { email: 'viewer@demo.cl', label: 'Lector', description: 'Solo ve su propio perfil' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function signIn(email, password) {
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();
    signIn(form.email, form.password);
  };

  return (
    <div className="login">
      <form className="card" onSubmit={onSubmit} noValidate>
        <h1>Iniciar sesión</h1>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <section className="card demo" aria-labelledby="demo-title">
        <h2 id="demo-title">¿Solo quieres probarlo?</h2>
        <p className="hint">
          Entra con un clic usando una cuenta de ejemplo. Cada rol ve y puede hacer cosas distintas.
        </p>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            className="demo-account"
            disabled={submitting}
            onClick={() => signIn(account.email, DEMO_PASSWORD)}
          >
            <strong>Entrar como {account.label}</strong>
            <span>{account.description}</span>
          </button>
        ))}
        <p className="hint">Los datos de la demo se reinician automáticamente cada día.</p>
      </section>
    </div>
  );
}
