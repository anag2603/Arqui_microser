const express = require('express');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// TODO (Ana): rutas del perfil (/users/me, /internal/users)

module.exports = app;
