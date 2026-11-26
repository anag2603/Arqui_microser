const express = require('express');
const { pool } = require('../db');
const { invalidateProfile } = require('../cache');

const router = express.Router();

// Middleware opcional: si hay secreto interno configurado en .env, lo exige
function verifyInternalSecret(req, res, next) {
  const expected = process.env.INTERNAL_SECRET || process.env.INTERNAL_API_KEY;
  if (!expected) return next();

  const received = req.headers['x-internal-secret'] || req.headers['x-internal-key'];
  if (received !== expected) {
    return res.status(403).json({ message: 'Acceso interno no autorizado' });
  }
  return next();
}

router.use(verifyInternalSecret);

// POST /internal/users -> Crea o actualiza el perfil base desde auth-service
router.post('/', async (req, res) => {
  const { user_id, userId, email, rol = 'user', nombre = null, telefono = null } = req.body;
  const id = String(user_id || userId || '').trim();

  if (!id || !email) {
    return res.status(400).json({ message: 'user_id y email son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO profiles (user_id, email, rol, nombre, telefono)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         email = EXCLUDED.email,
         rol = EXCLUDED.rol,
         nombre = COALESCE(EXCLUDED.nombre, profiles.nombre),
         telefono = COALESCE(EXCLUDED.telefono, profiles.telefono),
         updated_at = NOW()
       RETURNING user_id, email, rol, nombre, telefono, created_at, updated_at`,
      [id, email, rol, nombre, telefono],
    );

    await invalidateProfile(id);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error en POST /internal/users:', err.message);
    return res.status(500).json({ message: 'Error interno al guardar el perfil' });
  }
});

// GET /internal/users/:userId -> Consulta interna de perfil por ID
router.get('/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, email, rol, nombre, telefono, created_at, updated_at
       FROM profiles WHERE user_id = $1`,
      [req.params.userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error en GET /internal/users/:userId:', err.message);
    return res.status(500).json({ message: 'Error interno al consultar el perfil' });
  }
});

module.exports = router;
