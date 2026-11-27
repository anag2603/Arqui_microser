import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorMessages';
import { validateEmail } from '../utils/validators';
import '../styles/auth.css';

const HOME_ROUTE = '/profile'; // pantalla de Estrella (acordado en la sección 6)

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const { isAuthenticated, login, sessionNotice, clearSessionNotice } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ email: location.state?.registeredEmail || '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const justRegistered = Boolean(location.state?.registeredEmail);
  const redirectTo = location.state?.from?.pathname || HOME_ROUTE;

  // Si ya hay sesión (o el login acaba de salir bien), seguimos a la pantalla destino
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (sessionNotice) clearSessionNotice();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const newErrors = {
      email: validateEmail(form.email),
      password: form.password ? null : 'La contraseña es obligatoria',
    };
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (error) {
      setServerError(getErrorMessage(error, 'login'));
      setForm((prev) => ({ ...prev, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-card">
      <h1>Iniciar sesión</h1>

      {sessionNotice && (
        <p className="alert alert-info" role="status">
          {sessionNotice}
        </p>
      )}
      {justRegistered && !sessionNotice && (
        <p className="alert alert-success" role="status">
          Cuenta creada. Inicia sesión para continuar.
        </p>
      )}
      {serverError && (
        <p className="alert alert-error" role="alert">
          {serverError}
        </p>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input-email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <div className="input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="input-password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </main>
  );
}