const express = require('express');
const jwtLib = require('../lib/jwtProvider');
const { getRefreshToken } = require('../../../shared/redis/tokens');
const { isSessionActive, touchSession } = require('../../../shared/redis/session');

const router = express.Router();

// POST /auth/refresh   body: { refreshToken }   →   { accessToken }
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ message: 'refreshToken requerido' });
  }

  // 1. Firma y expiración del refresh token
  let claims;
  try {
    claims = await jwtLib.verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ message: 'Refresh token inválido o expirado' });
  }

  const { userId, email, rol, jti } = claims;

  try {
    // 2. Debe existir en Redis y coincidir (si hubo logout, ya no está)
    const stored = await getRefreshToken(userId, jti);
    if (!stored || stored !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token inválido o revocado' });
    }

    // 3. La sesión debe seguir activa (RF10); si lo está, se renueva
    if (!(await isSessionActive(userId))) {
      return res.status(401).json({ message: 'Sesión inactiva' });
    }
    await touchSession(userId);

    // 4. Nuevo access token
    const accessToken = await jwtLib.signAccessToken({ userId, email, rol });
    return res.json({ accessToken });
  } catch (err) {
    console.error('POST /auth/refresh falló:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;