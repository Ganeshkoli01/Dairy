import serverless from 'serverless-http';
import app from '../server/src/server.js';

export default serverless(app);
