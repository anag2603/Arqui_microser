const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const app = require('./app');

const port = process.env.AUTH_PORT || 3001;
app.listen(port, () => console.log(`auth-service escuchando en el puerto ${port}`));
