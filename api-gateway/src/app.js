const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authMiddleware } = require('../../shared/authMiddleware');

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// 1. CORS para permitir peticiones del frontend
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// 2. Sanitización de headers internos/sensibles para evitar suplantación desde el cliente
app.use((req, _res, next) => {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-email'];
  delete req.headers['x-user-rol'];
  delete req.headers['x-internal-secret'];
  delete req.headers['x-internal-key'];
  next();
});

// 3. Salud y documentación Swagger
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

const swaggerDocument = YAML.load(path.resolve(__dirname, '../../docs/openapi.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 4. Bloquear acceso externo directo a rutas internas
app.use('/internal', (_req, res) => {
  res.status(403).json({ message: 'Ruta interna no accesible desde el gateway' });
});

// 5. Protección JWT en rutas privadas
app.use('/users', authMiddleware);

// Helper para configurar proxies en http-proxy-middleware v3
function buildProxy(target, pathFilter) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('x-user-id', String(req.user.userId));
          if (req.user.email) proxyReq.setHeader('x-user-email', String(req.user.email));
          if (req.user.rol) proxyReq.setHeader('x-user-rol', String(req.user.rol));
        }
      },
      error: (err, _req, res) => {
        console.error(`Error de proxy hacia ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ message: 'Microservicio no disponible temporalmente' });
        }
      },
    },
  });
}

// 6. Redirección (Proxy) hacia auth-service y user-service
app.use(buildProxy(AUTH_SERVICE_URL, '/auth'));
app.use(buildProxy(USER_SERVICE_URL, '/users'));

module.exports = app;
