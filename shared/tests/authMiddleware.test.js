process.env.USE_MOCKS = 'true';
const { createAuthMiddleware } = require('../authMiddleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  const payload = {
    userId: 'u-1',
    email: 'test@tienda.com',
    rol: 'user',
    jti: 'jti-1',
    exp: 9999999999,
  };

  test('responde 401 si no se envía header Authorization', async () => {
    const mw = createAuthMiddleware({
      verifyAccessToken: jest.fn(),
      isBlacklisted: jest.fn(),
      isSessionActive: jest.fn(),
      touchSession: jest.fn(),
    });
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si el token es inválido o expiró', async () => {
    const mw = createAuthMiddleware({
      verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')),
      isBlacklisted: jest.fn(),
      isSessionActive: jest.fn(),
      touchSession: jest.fn(),
    });
    const req = { headers: { authorization: 'Bearer malo' } };
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si el jti está en la lista negra', async () => {
    const mw = createAuthMiddleware({
      verifyAccessToken: jest.fn().mockResolvedValue(payload),
      isBlacklisted: jest.fn().mockResolvedValue(true),
      isSessionActive: jest.fn(),
      touchSession: jest.fn(),
    });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si la sesión expiró por inactividad', async () => {
    const mw = createAuthMiddleware({
      verifyAccessToken: jest.fn().mockResolvedValue(payload),
      isBlacklisted: jest.fn().mockResolvedValue(false),
      isSessionActive: jest.fn().mockResolvedValue(false),
      touchSession: jest.fn(),
    });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('asigna req.user, renueva actividad y llama next() cuando todo es válido', async () => {
    const touchSession = jest.fn().mockResolvedValue();
    const mw = createAuthMiddleware({
      verifyAccessToken: jest.fn().mockResolvedValue(payload),
      isBlacklisted: jest.fn().mockResolvedValue(false),
      isSessionActive: jest.fn().mockResolvedValue(true),
      touchSession,
    });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const res = mockRes();
    const next = jest.fn();

    await mw(req, res, next);
    expect(touchSession).toHaveBeenCalledWith('u-1');
    expect(req.user.userId).toBe('u-1');
    expect(next).toHaveBeenCalled();
  });
});
