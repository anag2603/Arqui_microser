const express = require('express');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// TODO (Adalid, Ricardo): montar aquí las rutas de auth (register, login, refresh, logout)

module.exports = app;
