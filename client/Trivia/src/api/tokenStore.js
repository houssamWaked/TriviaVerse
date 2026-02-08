/**
 * Auth token storage helper for the frontend.
 *
 * The API client reads this token and sends it as:
 * `Authorization: Bearer <token>`
 *
 * You can swap this implementation later (cookies, secure storage, etc.)
 * without changing the rest of the API layer.
 */

import { deleteCookie, getCookie, setCookie } from '@/utils/cookies';
import { hasPerformanceConsent } from '@/utils/consent';

const TOKEN_KEY = 'token';
const TOKEN_COOKIE = 'tv_token';

export function getAuthToken() {
  try {
    const local = window.localStorage.getItem(TOKEN_KEY);
    if (hasPerformanceConsent()) {
      const fromCookie = getCookie(TOKEN_COOKIE);
      if (fromCookie) return fromCookie;
      if (local) {
        setCookie(TOKEN_COOKIE, local, { maxAgeSec: 60 * 60 * 24 * 30, sameSite: 'Strict' });
      }
    } else {
      deleteCookie(TOKEN_COOKIE);
    }
    return local;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (!token) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);

    if (!token || !hasPerformanceConsent()) deleteCookie(TOKEN_COOKIE);
    else setCookie(TOKEN_COOKIE, token, { maxAgeSec: 60 * 60 * 24 * 30, sameSite: 'Strict' });
  } catch {
    // ignore (e.g. privacy mode)
    try {
      if (!token || !hasPerformanceConsent()) deleteCookie(TOKEN_COOKIE);
      else setCookie(TOKEN_COOKIE, token, { maxAgeSec: 60 * 60 * 24 * 30, sameSite: 'Strict' });
    } catch {
      // ignore
    }
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}
