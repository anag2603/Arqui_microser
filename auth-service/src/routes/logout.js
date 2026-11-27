const express = require('express');
const { blacklistToken, deleteRefreshTokens } = require('../../../shared/redis/tokens');
const { clearSession } = require('../../../shared/redis/session');

const router = express.Router();

// POST /auth/logout   (ruta protegida: el gateway ya validó el JWT)
router.post('/logout', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const jti = req.headers['x-token-jti'];
  const exp = Number(req.headers['x-token-exp']);

  if (!userId || !jti || !exp) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  // Tiempo que le falta al token para expirar: ese es el TTL de la lista negra
  const ttl = exp - Math.floor(Date.now() / 1000);

  try {
    await blacklistToken(jti, ttl);       // 1. el access token ya no sirve
    await deleteRefreshTokens(userId);    // 2. no se puede renovar
    await clearSession(userId);           // 3. se cierra la sesión
    return res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    console.error('POST /auth/logout falló:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;