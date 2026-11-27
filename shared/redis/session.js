const { redis, keys } = require('./client');

// Se lee en cada llamada para poder cambiarlo en pruebas (por ejemplo, a 5 segundos)
const inactivitySeconds = () => Number(process.env.SESSION_INACTIVITY_SECONDS) || 1800;

// Registra la última actividad y renueva el TTL
async function touchSession(userId) {
  await redis.set(keys.session(userId), String(Date.now()), 'EX', inactivitySeconds());
}

// true si la sesión no expiró por inactividad
async function isSessionActive(userId) {
  return (await redis.exists(keys.session(userId))) === 1;
}

// Cierra la sesión (logout)
async function clearSession(userId) {
  await redis.del(keys.session(userId));
}

// Última actividad en milisegundos, o null si no hay sesión
async function getLastActivity(userId) {
  const value = await redis.get(keys.session(userId));
  return value ? Number(value) : null;
}

module.exports = { touchSession, isSessionActive, clearSession, getLastActivity };