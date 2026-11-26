const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
});

redis.on('error', (err) => console.error('user-service: error de Redis:', err.message));

const TTL_SECONDS = Number(process.env.PROFILE_CACHE_TTL_SECONDS || 300);
const key = (userId) => `profile:${userId}`;

// La caché es una optimización: si Redis falla, el servicio sigue funcionando con la BD.
async function getCachedProfile(userId) {
  try {
    const raw = await redis.get(key(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('cache get falló:', err.message);
    return null;
  }
}

async function setCachedProfile(userId, profile) {
  try {
    await redis.set(key(userId), JSON.stringify(profile), 'EX', TTL_SECONDS);
  } catch (err) {
    console.error('cache set falló:', err.message);
  }
}

async function invalidateProfile(userId) {
  try {
    await redis.del(key(userId));
  } catch (err) {
    console.error('cache del falló:', err.message);
  }
}

module.exports = { getCachedProfile, setCachedProfile, invalidateProfile };