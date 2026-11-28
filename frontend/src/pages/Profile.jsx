import { useEffect, useState } from 'react';
import { getMe, updateMe } from '../api/users';
import { getErrorMessage } from '../utils/errorMessage';
import Alert from '../components/Alert';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';

const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;

function validate(values) {
  const errors = {};
  if (values.nombre.length > 100) {
    errors.nombre = 'Máximo 100 caracteres';
  }
  const telefono = values.telefono.trim();
  if (telefono && !PHONE_REGEX.test(telefono)) {
    errors.telefono = 'Usa de 7 a 20 caracteres: números, +, (), - y espacios';
  }
  return errors;
}

export default function Profile() {
  const [state, setState] = useState({ status: 'loading', profile: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((profile) => {
        if (!cancelled) setState({ status: 'ready', profile, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', profile: null, error: getErrorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function retry() {
    setState({ status: 'loading', profile: null, error: '' });
    setAttempt((n) => n + 1);
  }

  function startEdit() {
    setForm({
      nombre: state.profile.nombre ?? '',
      telefono: state.profile.telefono ?? '',
    });
    setFieldErrors({});
    setFeedback(null);
    setEditing(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const { profile } = state;
    const nombre = form.nombre.trim();
    const telefono = form.telefono.trim();

    const changes = {};
    if (nombre !== (profile.nombre ?? '')) changes.nombre = nombre;
    if (telefono && telefono !== (profile.telefono ?? '')) changes.telefono = telefono;

    if (Object.keys(changes).length === 0) {
      setEditing(false);
      setFeedback({ type: 'info', text: 'No hiciste cambios.' });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMe(changes);
      setState({ status: 'ready', profile: updated, error: '' });
      setEditing(false);
      setFeedback({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === 'loading') {
    return <Spinner label="Cargando perfil..." />;
  }

  if (state.status === 'error') {
    return (
      <section className="card">
        <h1>Mi perfil</h1>
        <Alert type="error">{state.error}</Alert>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={retry}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  const { profile } = state;

  return (
    <section className="card">
      <div className="card-header">
        <h1>Mi perfil</h1>
        {!editing && (
          <button type="button" className="btn btn-secondary" onClick={startEdit}>
            Editar
          </button>
        )}
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {editing ? (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <FormField id="email" label="Correo" type="email" value={profile.email} disabled readOnly />
          <FormField
            id="nombre"
            label="Nombre"
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            error={fieldErrors.nombre}
            autoComplete="name"
          />
          <FormField
            id="telefono"
            label="Teléfono"
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            error={fieldErrors.telefono}
            hint="Ejemplo: 55 1234 5678"
            autoComplete="tel"
          />
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="profile-list">
          <dt>ID de usuario</dt>
          <dd>{profile.userId}</dd>
          <dt>Correo</dt>
          <dd>{profile.email}</dd>
          <dt>Rol</dt>
          <dd>{profile.rol}</dd>
          <dt>Nombre</dt>
          <dd>{profile.nombre || <span className="muted">Sin definir</span>}</dd>
          <dt>Teléfono</dt>
          <dd>{profile.telefono || <span className="muted">Sin definir</span>}</dd>
        </dl>
      )}
    </section>
  );
}
