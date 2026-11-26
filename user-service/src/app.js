const express = require('express');
const internalRoutes = require('./routes/internal');
const usersRoutes = require('./routes/users');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.use('/internal/users', internalRoutes);
app.use('/users', usersRoutes);

module.exports = app;