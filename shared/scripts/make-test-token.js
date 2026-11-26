const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');

// Uso: node shared/scripts/make-test-token.js [jti] [expiresIn] [userId]
const jti = process.argv[2] || 'jti-prueba-1';
const expiresIn = process.argv[3] || '15m';
const userId = process.argv[4] || '1';

const token = jwt.sign(
  { userId, email: 'prueba@ejemplo.com', rol: 'user' },
  process.env.JWT_SECRET,
  { expiresIn, jwtid: jti }
);

console.log(token);