import { deleteCookie, deleteCookiesByPrefix } from './cookies';
import { cacheClearAll } from './webCache';

const KEY = 'tv_consent_v1';

type ConsentValue = {
  performance: boolean;
  updated_at: string | null;
};

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Read the persisted consent preferences.
 * @returns Stored consent value or `null` if not set/invalid.
 */
export function getConsent(): ConsentValue | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Partial<ConsentValue>;
    return {
      performance: Boolean(value.performance),
      updated_at: value.updated_at ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Check whether the user has opted into performance storage/caching.
 * @returns `true` when performance consent is enabled.
 */
export function hasPerformanceConsent(): boolean {
  return Boolean(getConsent()?.performance);
}

/**
 * Persist consent preferences and broadcast a `tv:consent` event.
 * @param performance Whether to allow performance storage/caching.
 * @returns The saved consent value.
 */
export function setConsent({
  performance,
}: {
  performance: boolean;
}): ConsentValue {
  const value: ConsentValue = {
    performance: Boolean(performance),
    updated_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new CustomEvent<ConsentValue>('tv:consent', { detail: value }));
  } catch {
    // ignore
  }

  if (!value.performance) {
    cacheClearAll();
    deleteCookiesByPrefix('tv_cache_v1:');
    deleteCookie('tv_token');
    deleteCookie('tv_user');
  }

  return value;
}

/**
 * Decide whether the app should display the consent banner.
 * @returns `true` if no consent record exists yet.
 */
export function shouldShowConsentBanner(): boolean {
  return getConsent() == null;
}
