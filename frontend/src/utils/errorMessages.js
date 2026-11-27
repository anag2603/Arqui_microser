const NETWORK = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
const SERVER = 'Ocurrió un error en el servidor. Intenta de nuevo en unos minutos.';

function blockedMessage(headers) {
  // El header solo es legible si el gateway lo expone en CORS (ver acuerdos con Ana)
  const seconds = Number(headers?.['retry-after']);
  if (seconds > 0) {
    const minutes = Math.ceil(seconds / 60);
    return `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
  }
  return 'Demasiados intentos fallidos. Tu cuenta está bloqueada temporalmente; intenta de nuevo en unos minutos (hasta 15).';
}

export function getErrorMessage(error, context) {
  if (!error?.response) return NETWORK;

  const { status, data, headers } = error.response;
  const serverMessage = typeof data?.message === 'string' ? data.message : null;

  if (context === 'register') {
    if (status === 400) return serverMessage || 'Revisa los datos ingresados.';
    if (status === 409) return 'Este email ya está registrado. Inicia sesión o usa otro.';
    if (status === 502) return 'No se pudo completar el registro. Intenta de nuevo.';
  }

  if (context === 'login') {
    if (status === 400) return 'Ingresa tu email y tu contraseña.';
    if (status === 401) return 'Email o contraseña incorrectos.';
    if (status === 429) return blockedMessage(headers);
  }

  if (status >= 500) return SERVER;
  return serverMessage || 'Ocurrió un error inesperado.';
}