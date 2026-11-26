const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

// SOLO PARA DESARROLLO. Se activa con USE_MOCKS=true.
// MOCK_BLACKLISTED_JTI=<jti>  -> simula un token en la lista negra
// MOCK_SESSION_INACTIVE=true  -> simula una sesión inactiva
module.exports = {
  verifyAccessToken: (token) => jwt.verify(token, process.env.JWT_SECRET),
  isBlacklisted: async (jti) => jti === process.env.MOCK_BLACKLISTED_JTI,
  isSessionActive: async () => process.env.MOCK_SESSION_INACTIVE !== 'true',
  touchSession: async () => {},
};