const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Uso: node auth-service/scripts/dev-login.js [userId] [accessTtl]
process.env.USE_MOCKS = 'true';
if (process.argv[3]) {
  process.env.JWT_ACCESS_TTL = process.argv[3];
}

const jwtLib = require('../src/lib/jwtProvider');
const { saveRefreshToken } = require('../../shared/redis/tokens');
const { touchSession } = require('../../shared/redis/session');
const { closeRedis } = require('../../shared/redis/client');

async function main() {
  const userId = process.argv[2] || '1';
  const payload = { userId, email: 'prueba@ejemplo.com', rol: 'user' };

  const accessToken = jwtLib.signAccessToken(payload);
  const refreshToken = jwtLib.signRefreshToken(payload);
  const access = jwtLib.verifyAccessToken(accessToken);
  const refresh = jwtLib.verifyRefreshToken(refreshToken);

  const ttl = refresh.exp - Math.floor(Date.now() / 1000);
  await saveRefreshToken(userId, refresh.jti, refreshToken, ttl);
  await touchSession(userId);

  console.log(
    JSON.stringify(
      {
        accessToken,
        refreshToken,
        headersParaLogout: {
          'x-user-id': userId,
          'x-token-jti': access.jti,
          'x-token-exp': String(access.exp),
        },
      },
      null,
      2,
    ),
  );
  await closeRedis();
}

main().catch(async (err) => {
  console.error('dev-login falló:', err);
  await closeRedis();
  process.exit(1);
});