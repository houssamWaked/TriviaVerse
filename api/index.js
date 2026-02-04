/**
 * API entrypoint.
 *
 * Responsibilities:
 * - Loads environment variables (see `src/config/env.js`)
 * - Imports the Express app from `src/app.js`
 * - Starts the HTTP listener (except in `NODE_ENV=test`)
 *
 * Notes:
 * - Keep `index.js` "thin" so `src/app.js` can be imported in tests without
 *   starting a server.
 */
import './src/config/env.js';
import app from './src/app.js';

const port = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

export default app;
