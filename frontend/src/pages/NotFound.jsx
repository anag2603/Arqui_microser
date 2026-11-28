import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card card-center">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección que buscas no existe.</p>
      <div className="actions">
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
