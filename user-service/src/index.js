const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = require('./app');
const { initDb } = require('./db');

const PORT = Number(process.env.USER_SERVICE_PORT || process.env.PORT || 3002);

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`user-service escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar user-service:', err.message);
    process.exit(1);
  }
}

start();