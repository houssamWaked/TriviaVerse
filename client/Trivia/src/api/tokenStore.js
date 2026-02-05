/**
 * Auth token storage helper for the frontend.
 *
 * The API client reads this token and sends it as:
 * `Authorization: Bearer <token>`
 *
 * You can swap this implementation later (cookies, secure storage, etc.)
 * without changing the rest of the API layer.
 */

const TOKEN_KEY = 'token';

export function getAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (!token) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (e.g. privacy mode)
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

