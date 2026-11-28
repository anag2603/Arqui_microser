import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveAccessToken } from '../storage/tokenStorage';
import { mockAdapter } from './mockAdapter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const baseConfig = {
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCKS && { adapter: mockAdapter }),
};

// Instancia principal (con interceptores) y una "limpia" solo para el refresh (evita bucles)
const api = axios.create(baseConfig);
const bare = axios.create(baseConfig);

// Textos del gateway (Ana). Si cambian, se ajustan solo aquí.
const MESSAGE_EXPIRED = 'Token inválido o expirado';
const REASON_BY_MESSAGE = { 'Sesión inactiva': 'inactive', 'Sesión cerrada': 'closed' };
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

const isAuthPath = (url = '') => NO_REFRESH_PATHS.some((path) => url.includes(path));

// El contexto de autenticación se registra aquí para enterarse de lo que pasa en los interceptores
let handlers = {};
export function setAuthHandlers(newHandlers) {
  handlers = newHandlers || {};
}

// 1. Agregar el access token a cada petición
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isAuthPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Renovar el access token (una sola llamada aunque falle más de una petición a la vez)
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('NO_REFRESH_TOKEN'));
    }
    refreshPromise = bare
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        saveAccessToken(data.accessToken);
        handlers.onTokenRefreshed?.(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// 3. Si llega un 401, renovar y reintentar (o cerrar sesión)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || !config || isAuthPath(config.url)) {
      return Promise.reject(error);
    }

    const message = response.data?.message;

    // Sesión cerrada, inactiva o sin token, o ya reintentamos una vez: renovar no sirve
    if (message !== MESSAGE_EXPIRED || config._retry) {
      handlers.onSessionExpired?.(REASON_BY_MESSAGE[message] || 'expired');
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      await refreshAccessToken();
      return api(config); // el interceptor de la petición pone el token nuevo
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status;
      if (refreshStatus === 401 || refreshError.message === 'NO_REFRESH_TOKEN') {
        const reason = REASON_BY_MESSAGE[refreshError.response?.data?.message] || 'expired';
        clearTokens();
        handlers.onSessionExpired?.(reason);
      }
      return Promise.reject(error);
    }
  },
);

// Solo en desarrollo: para probar desde la consola del navegador (api.get('/users/me'))
if (import.meta.env.DEV) {
  window.api = api;
}

export default api;