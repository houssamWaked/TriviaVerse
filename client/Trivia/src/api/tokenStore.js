/**
 * Auth token storage helper for the frontend.
 *
 * The API client reads this token and sends it as:
 * `Authorization: Bearer <token>`
 *
 * Security note:
 * - We intentionally keep the access token in-memory (not in localStorage) to
 *   reduce persistence if an XSS bug exists.
 * - Long-lived refresh tokens are handled server-side via httpOnly cookies.
 */

let memoryToken = null;
let bootstrapped = false;

function bootstrapLegacyToken() {
  if (bootstrapped) return;
  bootstrapped = true;

  try {
    const legacy = window.localStorage.getItem('token');
    if (legacy) {
      memoryToken = String(legacy);
      window.localStorage.removeItem('token');
    }
  } catch {
    // ignore
  }
}

export function getAuthToken() {
  bootstrapLegacyToken();
  return memoryToken;
}

export function setAuthToken(token) {
  bootstrapLegacyToken();
  memoryToken = token ? String(token) : null;
}

export function clearAuthToken() {
  setAuthToken(null);
}
