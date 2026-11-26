const express = require('express');
const refreshRoute = require('./routes/refresh');
const logoutRoute = require('./routes/logout');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// TODO (Adalid, Ricardo): montar aquí las rutas de auth (register, login, refresh, logout)

app.use('/auth', refreshRoute);
app.use('/auth', logoutRoute);

module.exports = app;
