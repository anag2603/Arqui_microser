const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const app = require('./app');

const port = process.env.USER_PORT || 3002;
app.listen(port, () => console.log(`user-service escuchando en el puerto ${port}`));
