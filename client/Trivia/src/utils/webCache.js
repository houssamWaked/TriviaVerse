import { deleteCookie, getCookie, setCookie } from './cookies';
import { hasPerformanceConsent } from './consent';

const PREFIX = 'tv_cache_v1:';
const MAX_COOKIE_CHARS = 3500; // stay under ~4KB cookie cap

function nowMs() {
  return Date.now();
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function encodeRecord(record) {
  return JSON.stringify(record);
}

function decodeRecord(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const { e, v } = parsed;
  if (!Number.isFinite(Number(e))) return null;
  return { e: Number(e), v };
}

export function cacheGet(key) {
  if (!hasPerformanceConsent()) return null;
  const k = `${PREFIX}${String(key || '')}`;
  if (k === PREFIX) return null;

  try {
    const raw = window.localStorage.getItem(k);
    if (!raw) return null;
    const rec = decodeRecord(raw);
    if (rec && rec.e > nowMs()) return rec.v;
    window.localStorage.removeItem(k);
  } catch {
    // ignore
  }

  const fromCookie = getCookie(k);
  if (fromCookie) {
    const rec = decodeRecord(fromCookie);
    if (rec && rec.e > nowMs()) return rec.v;
    deleteCookie(k);
  }

  return null;
}

export function cacheSet(key, value, { ttlMs = 60_000, prefer = 'localStorage' } = {}) {
  if (!hasPerformanceConsent()) return;
  const k = `${PREFIX}${String(key || '')}`;
  if (k === PREFIX) return;

  const rec = { e: nowMs() + Math.max(0, Number(ttlMs) || 0), v: value };
  const encoded = encodeRecord(rec);

  const preferCookie = prefer === 'cookie' || prefer === 'both';
  const preferLocal = prefer === 'localStorage' || prefer === 'both';

  if (preferCookie && encoded.length <= MAX_COOKIE_CHARS) {
    setCookie(k, encoded, { maxAgeSec: Math.ceil((Number(ttlMs) || 0) / 1000) || 1 });
  } else {
    deleteCookie(k);
  }

  if (preferLocal || encoded.length > MAX_COOKIE_CHARS) {
    try {
      window.localStorage.setItem(k, encoded);
    } catch {
      // ignore
    }
  }
}

export function cacheDelete(key) {
  if (!hasPerformanceConsent()) return;
  const k = `${PREFIX}${String(key || '')}`;
  if (k === PREFIX) return;
  deleteCookie(k);
  try {
    window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

export function cacheClearAll() {
  // Cookie clearing must be key-by-key; we can only clear localStorage here.
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
