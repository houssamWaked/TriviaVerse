/**
 * API entrypoint.
 */
import http from 'node:http';

import './src/config/env.js';
import app from './src/app.js';
import { initializeSocket } from './src/socket.js';

const port = Number(process.env.PORT || 3001);

if (process.env.NODE_ENV !== 'test') {
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

export default app;
