/**
 * Current user storage helper for the frontend.
 *
 * Keeps a minimal user snapshot in localStorage so the UI can persist login.
 * This is not a security boundary — the server still verifies JWTs.
 */

import { deleteCookie, getCookie, setCookie } from '@/utils/cookies';
import { hasPerformanceConsent } from '@/utils/consent';

const USER_KEY = 'user';
const USER_COOKIE = 'tv_user';

export function getCurrentUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    const local = raw ? JSON.parse(raw) : null;

    if (hasPerformanceConsent()) {
      const fromCookie = getCookie(USER_COOKIE);
      if (fromCookie) return JSON.parse(fromCookie);
      if (local) {
        setCookie(USER_COOKIE, JSON.stringify(local), {
          maxAgeSec: 60 * 60 * 24 * 30,
          sameSite: 'Strict',
        });
      }
    } else {
      deleteCookie(USER_COOKIE);
    }

    return local;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  try {
    if (!user) window.localStorage.removeItem(USER_KEY);
    else window.localStorage.setItem(USER_KEY, JSON.stringify(user));

    if (!user || !hasPerformanceConsent()) deleteCookie(USER_COOKIE);
    else
      setCookie(USER_COOKIE, JSON.stringify(user), {
        maxAgeSec: 60 * 60 * 24 * 30,
        sameSite: 'Strict',
      });
  } catch {
    // ignore (e.g. privacy mode)
    try {
      if (!user || !hasPerformanceConsent()) deleteCookie(USER_COOKIE);
      else
        setCookie(USER_COOKIE, JSON.stringify(user), {
          maxAgeSec: 60 * 60 * 24 * 30,
          sameSite: 'Strict',
        });
    } catch {
      // ignore
    }
  }
}

export function clearCurrentUser() {
  setCurrentUser(null);
}
