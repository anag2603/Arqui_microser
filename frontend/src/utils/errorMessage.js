export function getErrorMessage(err) {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.response) {
    return `Error del servidor (${err.response.status})`;
  }
  return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
}