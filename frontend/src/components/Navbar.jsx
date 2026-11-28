import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      navigate('/login', {
        replace: true,
        state: { message: 'Sesión cerrada correctamente' },
      });
    }
  }

  return (
    <header className="navbar">
      <nav className="navbar-inner" aria-label="Navegación principal">
        <Link to="/" className="brand">
          Tienda Online
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={linkClass}>
            Inicio
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className={linkClass}>
                Mi perfil
              </NavLink>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
