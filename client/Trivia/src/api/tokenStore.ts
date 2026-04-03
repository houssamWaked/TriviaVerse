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

const SESSION_KEY = 'tv_access_token_v1';

let memoryToken: string | null = null;
let bootstrapped = false;

function bootstrapLegacyToken() {
  if (bootstrapped) return;
  bootstrapped = true;

  try {
    const legacy = window.localStorage.getItem('token');
    if (legacy) {
      memoryToken = String(legacy);
      window.localStorage.removeItem('token');
      try {
        window.sessionStorage.setItem(SESSION_KEY, memoryToken);
      } catch {
        // ignore
      }
      return;
    }
  } catch {
    // ignore
  }

  try {
    const fromSession = window.sessionStorage.getItem(SESSION_KEY);
    if (fromSession) memoryToken = String(fromSession);
  } catch {
    // ignore
  }
}

export function getAuthToken() {
  bootstrapLegacyToken();
  return memoryToken;
}

export function setAuthToken(token: string | null | undefined) {
  bootstrapLegacyToken();
  memoryToken = token ? String(token) : null;
  try {
    if (memoryToken) window.sessionStorage.setItem(SESSION_KEY, memoryToken);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

