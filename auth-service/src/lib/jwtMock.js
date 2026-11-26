const path = require('path');
const crypto = require('crypto');

// auth-service no instala jsonwebtoken; lo tomamos de shared/ donde sí está
const jwt = require(
  require.resolve('jsonwebtoken', { paths: [path.resolve(__dirname, '../../../shared')] }),
);

const secret = () => process.env.JWT_SECRET;
const claims = (p) => ({ userId: p.userId, email: p.email, rol: p.rol });

// SOLO PARA DESARROLLO. Se activa con USE_MOCKS=true.
module.exports = {
  signAccessToken: (payload) =>
    jwt.sign(claims(payload), secret(), {
      expiresIn: process.env.JWT_ACCESS_TTL || '15m',
      jwtid: crypto.randomUUID(),
    }),
  signRefreshToken: (payload) =>
    jwt.sign(claims(payload), secret(), {
      expiresIn: Number(process.env.JWT_REFRESH_TTL_SECONDS || 604800),
      jwtid: crypto.randomUUID(),
    }),
  verifyAccessToken: (token) => jwt.verify(token, secret()),
  verifyRefreshToken: (token) => jwt.verify(token, secret()),
};