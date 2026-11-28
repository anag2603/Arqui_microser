import api from './client';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

let mockProfile = {
  userId: '1',
  email: 'prueba@ejemplo.com',
  rol: 'user',
  nombre: null,
  telefono: null,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMe() {
  if (USE_MOCKS) {
    await wait(400);
    return { ...mockProfile };
  }
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateMe(changes) {
  if (USE_MOCKS) {
    await wait(400);
    mockProfile = { ...mockProfile, ...changes };
    return { ...mockProfile };
  }
  const { data } = await api.put('/users/me', changes);
  return data;
}
