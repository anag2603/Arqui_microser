import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="card card-center">
      <h1>Bienvenido a la Tienda Online</h1>
      <p className="muted">Sistema de autenticación centralizado con JWT y Redis.</p>
      <div className="actions">
        {isAuthenticated ? (
          <Link to="/profile" className="btn btn-primary">
            Ver mi perfil
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary">
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
