/**
 * Centralized environment initialization.
 *
 * Side-effect import that loads `.env` into `process.env` via `dotenv`.
 *
 * Why this exists:
 * - Ensures env variables are loaded consistently regardless of whether the
 *   process starts from `index.js` or imports `src/app.js` directly in tests.
 *
 * Security:
 * - Never commit real secrets (service role keys, DB passwords) to git.
 * - Treat any secret pasted into chat/logs as compromised and rotate it.
 */
import 'dotenv/config';

// Centralized env initialization (side-effect import).
export {};
