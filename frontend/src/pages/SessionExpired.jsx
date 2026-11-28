import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MESSAGES = {
  inactive: {
    title: 'Sesión cerrada por inactividad',
    text: 'Pasó demasiado tiempo sin actividad y por seguridad cerramos tu sesión.',
  },
  closed: {
    title: 'Tu sesión fue cerrada',
    text: 'La sesión se cerró desde otro lugar o dispositivo.',
  },
  expired: {
    title: 'Tu sesión expiró',
    text: 'Tu sesión ya no es válida.',
  },
};

export default function SessionExpired() {
  const { isAuthenticated, sessionEndReason, clearSessionEndReason } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  const message = MESSAGES[sessionEndReason] || MESSAGES.expired;

  function goToLogin() {
    clearSessionEndReason();
    navigate('/login', { replace: true });
  }

  return (
    <section className="card card-center">
      <h1>{message.title}</h1>
      <p>{message.text}</p>
      <p className="muted">Inicia sesión de nuevo para continuar.</p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={goToLogin}>
          Iniciar sesión
        </button>
      </div>
    </section>
  );
}
