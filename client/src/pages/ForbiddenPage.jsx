import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="card">
      <h1>Sin permiso</h1>
      <p>Tu rol no tiene acceso a esta sección.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
