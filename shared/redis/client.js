const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  // Si Redis no responde, falla rápido en lugar de dejar la petición colgada
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis error:', err.message));

// Todas las claves del sistema se construyen aquí, para que nadie escriba nombres a mano
const keys = {
  refresh: (userId, jti) => `refresh:${userId}:${jti}`,
  refreshPattern: (userId) => `refresh:${userId}:*`,
  blacklist: (jti) => `blacklist:${jti}`,
  attempts: (email) => `login_attempts:${String(email).toLowerCase()}`,
  session: (userId) => `session:${userId}`,
};

async function closeRedis() {
  await redis.quit();
}

module.exports = { redis, keys, closeRedis };