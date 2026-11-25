const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const app = require('./app');

const port = process.env.GATEWAY_PORT || 3000;
app.listen(port, () => console.log(`api-gateway escuchando en el puerto ${port}`));
