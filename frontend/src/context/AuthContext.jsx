import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '../api/authApi';
import { setAuthHandlers } from '../api/client';
import {
  ACCESS_KEY,
  REFRESH_KEY,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../storage/tokenStorage';
import { decodeJwt } from '../utils/jwt';

const AuthContext = createContext(null);

const NOTICES = {
  expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
  closed: 'Tu sesión fue cerrada. Inicia sesión de nuevo.',
  inactive: 'Tu sesión se cerró por inactividad. Inicia sesión de nuevo.',
};

const EMPTY_TOKENS = { accessToken: null, refreshToken: null };

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  }));
  const [sessionNotice, setSessionNotice] = useState(null);
  const loggingOut = useRef(false);

  // Cierra la sesión local; con "reason" deja un aviso (salvo si el usuario pulsó "Cerrar sesión")
  const endSession = useCallback((reason) => {
    clearTokens();
    setTokens(EMPTY_TOKENS);
    if (reason && !loggingOut.current) {
      setSessionNotice(NOTICES[reason] || NOTICES.expired);
    }
  }, []);

  // El cliente Axios nos avisa cuando renueva el token o cuando la sesión terminó sola
  useEffect(() => {
    setAuthHandlers({
      onTokenRefreshed: (accessToken) => setTokens((prev) => ({ ...prev, accessToken })),
      onSessionExpired: endSession,
    });
    return () => setAuthHandlers({});
  }, [endSession]);

  // Si el usuario cierra sesión en otra pestaña, esta también se entera
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === null || event.key === ACCESS_KEY || event.key === REFRESH_KEY) {
        setTokens({ accessToken: getAccessToken(), refreshToken: getRefreshToken() });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const register = useCallback((email, password) => authApi.register(email, password), []);

  const login = useCallback(async (email, password) => {
    const { accessToken, refreshToken } = await authApi.login(email, password);
    saveTokens(accessToken, refreshToken);
    setTokens({ accessToken, refreshToken });
    setSessionNotice(null);
  }, []);

  const logout = useCallback(async () => {
    loggingOut.current = true;
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } catch {
      // Aunque el servidor falle (red, token vencido), cerramos la sesión localmente
    } finally {
      clearTokens();
      setTokens(EMPTY_TOKENS);
      loggingOut.current = false;
    }
  }, []);

  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  // Solo para mostrar en pantalla: nunca para decidir seguridad
  const user = useMemo(() => {
    const claims = tokens.accessToken ? decodeJwt(tokens.accessToken) : null;
    return claims ? { userId: claims.userId, email: claims.email, rol: claims.rol } : null;
  }, [tokens.accessToken]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(tokens.accessToken && tokens.refreshToken),
      user,
      sessionNotice,
      clearSessionNotice,
      register,
      login,
      logout,
    }),
    [tokens, user, sessionNotice, clearSessionNotice, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}