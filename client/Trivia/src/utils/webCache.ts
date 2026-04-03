import { deleteCookie, getCookie, setCookie } from './cookies';
import { hasPerformanceConsent } from './consent';

const PREFIX = 'tv_cache_v1:';
const ESSENTIAL_PREFIX = 'tv_ecache_v1:';
const MAX_COOKIE_CHARS = 3500;

type CachePreference = 'localStorage' | 'cookie' | 'both';

type CacheRecord<T = unknown> = {
  e: number;
  v: T;
};

function nowMs(): number {
  return Date.now();
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function encodeRecord<T>(record: CacheRecord<T>): string {
  return JSON.stringify(record);
}

function decodeRecord(raw: string): CacheRecord | null {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const { e, v } = parsed as Partial<CacheRecord>;
  if (!Number.isFinite(Number(e))) return null;
  return { e: Number(e), v };
}

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function storageDelete(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function storageClearByPrefix(prefix: string): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function cacheGet<T = unknown>(key: string): T | null {
  if (!hasPerformanceConsent()) return null;
  const storageKey = `${PREFIX}${String(key || '')}`;
  if (storageKey === PREFIX) return null;

  try {
    const raw = storageGet(storageKey);
    if (raw) {
      const record = decodeRecord(raw);
      if (record && record.e > nowMs()) return record.v as T;
      storageDelete(storageKey);
    }
  } catch {
    // ignore
  }

  const fromCookie = getCookie(storageKey);
  if (fromCookie) {
    const record = decodeRecord(fromCookie);
    if (record && record.e > nowMs()) return record.v as T;
    deleteCookie(storageKey);
  }

  return null;
}

export function cacheSet(
  key: string,
  value: unknown,
  options: { ttlMs?: number; prefer?: CachePreference } = {}
): void {
  if (!hasPerformanceConsent()) return;
  const storageKey = `${PREFIX}${String(key || '')}`;
  if (storageKey === PREFIX) return;

  const { ttlMs = 60_000, prefer = 'localStorage' } = options;
  const record = { e: nowMs() + Math.max(0, Number(ttlMs) || 0), v: value };
  const encoded = encodeRecord(record);

  const preferCookie = prefer === 'cookie' || prefer === 'both';
  const preferLocal = prefer === 'localStorage' || prefer === 'both';

  if (preferCookie && encoded.length <= MAX_COOKIE_CHARS) {
    setCookie(storageKey, encoded, { maxAgeSec: Math.ceil((Number(ttlMs) || 0) / 1000) || 1 });
  } else {
    deleteCookie(storageKey);
  }

  if (preferLocal || encoded.length > MAX_COOKIE_CHARS) {
    storageSet(storageKey, encoded);
  }
}

export function cacheDelete(key: string): void {
  if (!hasPerformanceConsent()) return;
  const storageKey = `${PREFIX}${String(key || '')}`;
  if (storageKey === PREFIX) return;
  deleteCookie(storageKey);
  storageDelete(storageKey);
}

export function cacheClearAll(): void {
  storageClearByPrefix(PREFIX);
}

export function essentialCacheGet<T = unknown>(key: string): T | null {
  const storageKey = `${ESSENTIAL_PREFIX}${String(key || '')}`;
  if (storageKey === ESSENTIAL_PREFIX) return null;

  const raw = storageGet(storageKey);
  if (!raw) return null;

  const record = decodeRecord(raw);
  if (record && record.e > nowMs()) return record.v as T;
  storageDelete(storageKey);
  return null;
}

export function essentialCacheSet(
  key: string,
  value: unknown,
  options: { ttlMs?: number } = {}
): void {
  const storageKey = `${ESSENTIAL_PREFIX}${String(key || '')}`;
  if (storageKey === ESSENTIAL_PREFIX) return;
  const { ttlMs = 60_000 } = options;
  const record = { e: nowMs() + Math.max(0, Number(ttlMs) || 0), v: value };
  storageSet(storageKey, encodeRecord(record));
}

export function essentialCacheDelete(key: string): void {
  const storageKey = `${ESSENTIAL_PREFIX}${String(key || '')}`;
  if (storageKey === ESSENTIAL_PREFIX) return;
  storageDelete(storageKey);
}

export function essentialCacheClearAll(): void {
  storageClearByPrefix(ESSENTIAL_PREFIX);
}

export function essentialCacheClearByPrefix(prefix: string): void {
  const storageKey = `${ESSENTIAL_PREFIX}${String(prefix || '')}`;
  if (storageKey === ESSENTIAL_PREFIX) return;
  storageClearByPrefix(storageKey);
}
