const express = require('express');

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// TODO (Ana): CORS, middleware JWT, proxy hacia auth-service y user-service, /docs (Swagger)
// Nota: no usar express.json() antes del proxy, puede romper el reenvío del body.

module.exports = app;
