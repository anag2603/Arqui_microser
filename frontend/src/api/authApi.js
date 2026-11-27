import api from './client';

export const register = (email, password) =>
  api.post('/auth/register', { email, password }).then((response) => response.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((response) => response.data);

export const logout = () => api.post('/auth/logout').then((response) => response.data);