const { redis, keys, closeRedis } = require('../redis/client');
const tokens = require('../redis/tokens');
const session = require('../redis/session');

async function main() {
  const userId = `smoke-${Date.now()}`;
  const jti = `jti-smoke-${Date.now()}`;

  console.log('--- refresh tokens ---');
  await tokens.saveRefreshToken(userId, jti, 'token-de-prueba', 60);
  console.log('getRefreshToken        ->', await tokens.getRefreshToken(userId, jti));
  console.log('TTL de la clave        ->', await redis.ttl(keys.refresh(userId, jti)));
  console.log('deleteRefreshTokens    ->', await tokens.deleteRefreshTokens(userId));
  console.log('getRefreshToken (tras borrar) ->', await tokens.getRefreshToken(userId, jti));

  console.log('--- lista negra ---');
  console.log('isBlacklisted (antes)  ->', await tokens.isBlacklisted(jti));
  await tokens.blacklistToken(jti, 30);
  console.log('isBlacklisted (después)->', await tokens.isBlacklisted(jti));
  console.log('TTL de la lista negra  ->', await redis.ttl(keys.blacklist(jti)));
  console.log('blacklistToken con TTL <= 0 ->', await tokens.blacklistToken(jti, -5));

  console.log('--- sesión ---');
  console.log('isSessionActive (antes)->', await session.isSessionActive(userId));
  await session.touchSession(userId);
  console.log('isSessionActive (después) ->', await session.isSessionActive(userId));
  console.log('TTL de la sesión       ->', await redis.ttl(keys.session(userId)));
  console.log('getLastActivity        ->', await session.getLastActivity(userId));
  await session.clearSession(userId);
  console.log('isSessionActive (tras clear) ->', await session.isSessionActive(userId));

  // Limpieza
  await redis.del(keys.blacklist(jti));
  await closeRedis();
}

main().catch(async (err) => {
  console.error('Falló la prueba:', err);
  await closeRedis();
  process.exit(1);
});