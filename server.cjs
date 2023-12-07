require('make-promises-safe');
const http = require('http');
let app = require('./app');
app.enable('trust proxy')
require('dotenv').config()
const port = process.env.port || 4200;
const server = http.createServer(app);
server.listen(port);
