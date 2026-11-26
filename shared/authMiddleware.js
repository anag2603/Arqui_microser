const BEARER = /^Bearer\s+(.+)$/i;

function loadDefaults() {
  if (process.env.USE_MOCKS === 'true') {
    return require('./devMocks');
  }
  const { verifyAccessToken } = require('./jwt');
  const { isBlacklisted } = require('./redis/tokens');
  const { isSessionActive, touchSession } = require('./redis/session');
  return { verifyAccessToken, isBlacklisted, isSessionActive, touchSession };
}

function createAuthMiddleware(deps) {
  const { verifyAccessToken, isBlacklisted, isSessionActive, touchSession } =
    deps || loadDefaults();

  return async function authMiddleware(req, res, next) {
    const match = BEARER.exec(req.headers.authorization || '');
    if (!match) {
      return res.status(401).json({ message: 'Token requerido' });
    }

    const token = match[1];
    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    try {
      if (await isBlacklisted(decoded.jti)) {
        return res.status(401).json({ message: 'Sesión cerrada' });
      }
      if (!(await isSessionActive(decoded.userId))) {
        return res.status(401).json({ message: 'Sesión inactiva' });
      }
      await touchSession(decoded.userId);
    } catch (err) {
      console.error('authMiddleware: error consultando Redis:', err.message);
      return res.status(503).json({ message: 'Servicio de sesión no disponible' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      rol: decoded.rol,
      jti: decoded.jti,
      exp: decoded.exp,
    };
    req.token = token;
    return next();
  };
}

const authMiddleware = createAuthMiddleware();

module.exports = { createAuthMiddleware, authMiddleware };