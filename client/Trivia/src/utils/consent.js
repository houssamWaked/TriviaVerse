import { deleteCookie, deleteCookiesByPrefix } from './cookies';
import { cacheClearAll } from './webCache';

const KEY = 'tv_consent_v1';

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getConsent() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      performance: !!parsed.performance,
      updated_at: parsed.updated_at || null,
    };
  } catch {
    return null;
  }
}

export function hasPerformanceConsent() {
  return !!getConsent()?.performance;
}

export function setConsent({ performance }) {
  const value = { performance: !!performance, updated_at: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new CustomEvent('tv:consent', { detail: value }));
  } catch {
    // ignore
  }

  if (!value.performance) {
    // Revoke performance storage.
    cacheClearAll();
    deleteCookiesByPrefix('tv_cache_v1:');
    deleteCookie('tv_token');
    deleteCookie('tv_user');
  }

  return value;
}

export function shouldShowConsentBanner() {
  return getConsent() == null;
}

