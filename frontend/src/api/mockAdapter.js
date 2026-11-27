import { AxiosError } from 'axios';
import { decodeJwt } from '../utils/jwt';

// SOLO PARA DESARROLLO. Se activa con VITE_USE_MOCKS=true.
// Simula el gateway según el contrato de la guía final. Todo vive en memoria.
const ACCESS_TTL_SECONDS = Number(import.meta.env.VITE_MOCK_ACCESS_TTL_SECONDS || 20);
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const LATENCY_MS = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const users = new Map([['prueba@ejemplo.com', { userId: '1', password: 'Password123!', rol: 'user' }]]);
const blacklistedJtis = new Set();
let nextUserId = 2;

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// JWT falso (sin firma real): suficiente para que el front lo decodifique
function fakeJwt(claims, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: now, exp: now + ttlSeconds, jti: crypto.randomUUID() };
  return [toBase64Url({ alg: 'none', typ: 'JWT' }), toBase64Url(payload), 'firma-falsa'].join('.');
}

function reply(config, status, data = {}, headers = {}) {
  const response = { data, status, statusText: String(status), headers, config, request: {} };
  if (status >= 200 && status < 300) {
    return Promise.resolve(response);
  }
  const code = status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
  return Promise.reject(new AxiosError(`Request failed with status code ${status}`, code, config, {}, response));
}

const fail = (config, status, message, headers) => reply(config, status, { message }, headers);

const isInactiveFlag = () => localStorage.getItem('mockFlag') === 'inactive';

// Valida el Bearer igual que el middleware de Ana
function authenticate(config) {
  const header = config.headers?.get?.('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return { status: 401, message: 'Token requerido' };

  const claims = decodeJwt(match[1]);
  if (!claims || claims.exp <= Math.floor(Date.now() / 1000)) {
    return { status: 401, message: 'Token inválido o expirado' };
  }
  if (blacklistedJtis.has(claims.jti)) return { status: 401, message: 'Sesión cerrada' };
  if (isInactiveFlag()) return { status: 401, message: 'Sesión inactiva' };
  return { claims };
}

export async function mockAdapter(config) {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const method = (config.method || 'get').toUpperCase();
  const path = (config.url || '').replace(config.baseURL || '', '');
  const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  switch (`${method} ${path}`) {
    case 'POST /auth/register': {
      if (!EMAIL_REGEX.test(email)) return fail(config, 400, 'Email inválido');
      if (password.length < 8 || password.length > 72) {
        return fail(config, 400, 'La contraseña debe tener entre 8 y 72 caracteres');
      }
      if (email === 'falla@ejemplo.com') {
        return fail(config, 502, 'No se pudo completar el registro. Intenta de nuevo');
      }
      if (email === 'repetido@ejemplo.com' || users.has(email)) {
        return fail(config, 409, 'El email ya está registrado');
      }
      const userId = String(nextUserId++);
      users.set(email, { userId, password, rol: 'user' });
      return reply(config, 201, { userId, email });
    }

    case 'POST /auth/login': {
      if (!email || !password) return fail(config, 400, 'email y password son obligatorios');
      if (email === 'bloqueado@ejemplo.com') {
        return fail(config, 429, 'Demasiados intentos fallidos. Intenta de nuevo más tarde', {
          'retry-after': '900',
        });
      }
      const user = users.get(email);
      if (!user || user.password !== password) return fail(config, 401, 'Credenciales inválidas');

      const claims = { userId: user.userId, email, rol: user.rol };
      return reply(config, 200, {
        accessToken: fakeJwt(claims, ACCESS_TTL_SECONDS),
        refreshToken: fakeJwt({ ...claims, type: 'refresh' }, REFRESH_TTL_SECONDS),
      });
    }

    case 'POST /auth/refresh': {
      if (!body.refreshToken) return fail(config, 400, 'refreshToken requerido');
      const claims = decodeJwt(body.refreshToken);
      if (!claims || claims.type !== 'refresh' || claims.exp <= Math.floor(Date.now() / 1000)) {
        return fail(config, 401, 'Refresh token inválido o revocado');
      }
      if (isInactiveFlag()) return fail(config, 401, 'Sesión inactiva');
      return reply(config, 200, {
        accessToken: fakeJwt({ userId: claims.userId, email: claims.email, rol: claims.rol }, ACCESS_TTL_SECONDS),
      });
    }

    case 'POST /auth/logout': {
      const auth = authenticate(config);
      if (auth.status) return fail(config, auth.status, auth.message);
      blacklistedJtis.add(auth.claims.jti);
      return reply(config, 200, { message: 'Sesión cerrada' });
    }

    case 'GET /users/me': {
      const auth = authenticate(config);
      if (auth.status) return fail(config, auth.status, auth.message);
      const { userId, email: userEmail, rol } = auth.claims;
      return reply(config, 200, { userId, email: userEmail, rol, nombre: null, telefono: null });
    }

    default:
      return fail(config, 404, `Ruta sin mock: ${method} ${path}`);
  }
}