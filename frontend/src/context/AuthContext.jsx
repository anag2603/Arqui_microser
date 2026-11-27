import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// VERSIÓN DE LA BASE: mismo contrato que la real, con comportamiento falso.
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user: isAuthenticated ? { userId: '1', email: 'prueba@ejemplo.com', rol: 'user' } : null,
      sessionNotice: null,
      clearSessionNotice: () => {},
      register: async () => ({ userId: '1' }),
      login: async () => setIsAuthenticated(true),
      logout: async () => setIsAuthenticated(false),
    }),
    [isAuthenticated],
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