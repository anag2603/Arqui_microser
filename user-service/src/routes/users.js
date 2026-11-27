const express = require('express');
const { pool } = require('../db');
const { getCachedProfile, setCachedProfile, invalidateProfile } = require('../cache');
const { authMiddleware } = require('../../../shared/authMiddleware');

const router = express.Router();

// Todas las rutas de /users requieren JWT válido
router.use(authMiddleware);

// GET /users/me -> Lee primero de Redis; si no está, consulta PostgreSQL y guarda en caché
router.get('/me', async (req, res) => {
  const userId = String(req.user.userId);

  try {
    const cached = await getCachedProfile(userId);
    if (cached) {
      return res.json(cached);
    }

    const { rows } = await pool.query(
      `SELECT user_id, email, rol, nombre, telefono, created_at, updated_at
       FROM profiles WHERE user_id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    await setCachedProfile(userId, rows[0]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error en GET /users/me:', err.message);
    return res.status(500).json({ message: 'Error al obtener el perfil' });
  }
});

// PATCH /users/me y PUT /users/me -> Actualiza datos en BD e invalida la caché en Redis
async function updateMe(req, res) {
  const userId = String(req.user.userId);
  const { nombre, telefono } = req.body;

  if (nombre === undefined && telefono === undefined) {
    return res.status(400).json({ message: 'Envía al menos nombre o telefono para actualizar' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE profiles
       SET nombre = COALESCE($1, nombre),
           telefono = COALESCE($2, telefono),
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING user_id, email, rol, nombre, telefono, created_at, updated_at`,
      [nombre ?? null, telefono ?? null, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    await invalidateProfile(userId);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error en actualización de /users/me:', err.message);
    return res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
}

router.patch('/me', updateMe);
router.put('/me', updateMe);

module.exports = router;
