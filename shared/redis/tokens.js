const { redis, keys } = require('./client');

const refreshTtlSeconds = () => Number(process.env.JWT_REFRESH_TTL_SECONDS) || 604800;

// ---------- Refresh tokens (RF4) ----------

// Guarda el refresh token asociado al usuario. Si no se indica TTL, usa el de .env
async function saveRefreshToken(userId, jti, token, ttlSeg) {
  const ttl = Math.max(1, Math.floor(ttlSeg || refreshTtlSeconds()));
  await redis.set(keys.refresh(userId, jti), token, 'EX', ttl);
}

// Devuelve el refresh token guardado, o null si no existe o ya expiró
async function getRefreshToken(userId, jti) {
  return redis.get(keys.refresh(userId, jti));
}

// Borra TODOS los refresh tokens del usuario (usa SCAN, no KEYS). Devuelve cuántos borró
async function deleteRefreshTokens(userId) {
  let cursor = '0';
  let deleted = 0;
  do {
    const [next, found] = await redis.scan(
      cursor,
      'MATCH',
      keys.refreshPattern(userId),
      'COUNT',
      100,
    );
    cursor = next;
    if (found.length > 0) {
      deleted += await redis.del(...found);
    }
  } while (cursor !== '0');
  return deleted;
}

// ---------- Lista negra (RF6) ----------

// Mete el jti a la lista negra hasta que el token expire. Si ya expiró, no hace falta guardarlo
async function blacklistToken(jti, ttlSeg) {
  const ttl = Math.floor(ttlSeg);
  if (!ttl || ttl <= 0) {
    return false;
  }
  await redis.set(keys.blacklist(jti), '1', 'EX', ttl);
  return true;
}

// true si el token fue invalidado por un logout
async function isBlacklisted(jti) {
  return (await redis.exists(keys.blacklist(jti))) === 1;
}

module.exports = {
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshTokens,
  blacklistToken,
  isBlacklisted,
};