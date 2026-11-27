const request = require('supertest');

jest.mock('../src/db', () => ({
  pool: { query: jest.fn() },
  initDb: jest.fn(),
}));

jest.mock('../src/cache', () => ({
  getCachedProfile: jest.fn(),
  setCachedProfile: jest.fn(),
  invalidateProfile: jest.fn(),
}));

jest.mock('../../shared/authMiddleware', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { userId: 'u-1', email: 'ana@tienda.com', rol: 'user' };
    next();
  },
}));

const app = require('../src/app');
const { pool } = require('../src/db');
const cache = require('../src/cache');

describe('user-service endpoints', () => {
  beforeEach(() => jest.clearAllMocks());

  test('POST /internal/users crea el perfil y limpia caché', async () => {
    const perfil = { user_id: 'u-1', email: 'ana@tienda.com', rol: 'user', nombre: 'Ana' };
    pool.query.mockResolvedValue({ rows: [perfil] });

    const res = await request(app)
      .post('/internal/users')
      .send({ userId: 'u-1', email: 'ana@tienda.com', nombre: 'Ana' });

    expect(res.status).toBe(201);
    expect(res.body.user_id).toBe('u-1');
    expect(cache.invalidateProfile).toHaveBeenCalledWith('u-1');
  });

  test('GET /users/me devuelve desde caché sin consultar BD si existe', async () => {
    const cached = { user_id: 'u-1', email: 'ana@tienda.com', nombre: 'Ana' };
    cache.getCachedProfile.mockResolvedValue(cached);

    const res = await request(app).get('/users/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cached);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('GET /users/me consulta BD y guarda en caché cuando hay cache miss', async () => {
    const dbRow = { user_id: 'u-1', email: 'ana@tienda.com', nombre: 'Ana' };
    cache.getCachedProfile.mockResolvedValue(null);
    pool.query.mockResolvedValue({ rows: [dbRow] });

    const res = await request(app).get('/users/me');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalled();
    expect(cache.setCachedProfile).toHaveBeenCalledWith('u-1', dbRow);
  });

  test('PUT /users/me actualiza perfil e invalida caché', async () => {
    const updated = {
      user_id: 'u-1',
      email: 'ana@tienda.com',
      nombre: 'Ana G.',
      telefono: '2221234567',
    };
    pool.query.mockResolvedValue({ rows: [updated] });

    const res = await request(app)
      .put('/users/me')
      .send({ nombre: 'Ana G.', telefono: '2221234567' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Ana G.');
    expect(cache.invalidateProfile).toHaveBeenCalledWith('u-1');
  });
});
