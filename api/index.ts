/**
 * API entrypoint.
 */
import './src/config/env.js';
import app from './src/app.js';

const port = Number(process.env.PORT || 3001);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

export default app;
