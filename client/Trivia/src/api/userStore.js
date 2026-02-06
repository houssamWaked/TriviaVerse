/**
 * Current user storage helper for the frontend.
 *
 * Keeps a minimal user snapshot in localStorage so the UI can persist login.
 * This is not a security boundary — the server still verifies JWTs.
 */

const USER_KEY = 'user';

export function getCurrentUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  try {
    if (!user) window.localStorage.removeItem(USER_KEY);
    else window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore (e.g. privacy mode)
  }
}

export function clearCurrentUser() {
  setCurrentUser(null);
}

