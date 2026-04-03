/**
 * In-memory session cache for "flash-fast" gameplay.
 */

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

type SessionValue = {
  user_id?: string;
  [key: string]: unknown;
} | null;

type CacheEntry = {
  value: SessionValue;
  expires_at_ms: number;
};

function nowMs() {
  return Date.now();
}

export class SessionCache {
  ttlMs: number;
  map: Map<string, CacheEntry>;

  constructor({ ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}) {
    this.ttlMs = Math.max(10_000, Number(ttlMs) || DEFAULT_TTL_MS);
    this.map = new Map<string, CacheEntry>();
  }

  private prune() {
    const currentTime = nowMs();
    for (const [key, entry] of this.map.entries()) {
      if (
        !entry ||
        (Number.isFinite(Number(entry.expires_at_ms)) && entry.expires_at_ms <= currentTime)
      ) {
        this.map.delete(key);
      }
    }
  }

  get(sessionId: string | null | undefined) {
    if (!sessionId) return null;
    this.prune();
    const entry = this.map.get(String(sessionId));
    if (!entry) return null;
    if (Number.isFinite(Number(entry.expires_at_ms)) && entry.expires_at_ms <= nowMs()) {
      this.map.delete(String(sessionId));
      return null;
    }
    return entry.value || null;
  }

  set(sessionId: string | null | undefined, value: SessionValue) {
    if (!sessionId) return false;
    this.prune();
    const key = String(sessionId);
    this.map.set(key, { value, expires_at_ms: nowMs() + this.ttlMs });
    return true;
  }

  del(sessionId: string | null | undefined) {
    if (!sessionId) return false;
    return this.map.delete(String(sessionId));
  }

  delByUserId(userId: string | null | undefined) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return 0;
    this.prune();
    let removed = 0;
    for (const [key, entry] of this.map.entries()) {
      if (String(entry?.value?.user_id || '') === normalizedUserId) {
        this.map.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
}

export const sessionCache = new SessionCache();
