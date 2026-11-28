export const ACCESS_KEY = 'tienda.accessToken';
export const REFRESH_KEY = 'tienda.refreshToken';

const memory = new Map();

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

function remove(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

export function saveTokens(accessToken, refreshToken) {
  write(ACCESS_KEY, accessToken);
  write(REFRESH_KEY, refreshToken);
}

export const saveAccessToken = (accessToken) => write(ACCESS_KEY, accessToken);

export function clearTokens() {
  remove(ACCESS_KEY);
  remove(REFRESH_KEY);
}