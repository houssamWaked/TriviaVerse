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

// Tiny TTL-based in-memory cache for active gameplay sessions.
export class SessionCache {
  ttlMs: number;
  map: Map<string, CacheEntry>;

  /**
   * Create a cache instance.
   * @param ttlMs Time-to-live in ms for entries (min 10s).
   * @returns A `SessionCache` instance.
   */
  constructor({ ttlMs = DEFAULT_TTL_MS }: { ttlMs?: number } = {}) {
    this.ttlMs = Math.max(10_000, Number(ttlMs) || DEFAULT_TTL_MS);
    this.map = new Map<string, CacheEntry>();
  }

  /**
   * Drop expired entries (called opportunistically on cache operations).
   * @returns Nothing.
   */
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

  /**
   * Read a cached session snapshot.
   * @param sessionId Session id.
   * @returns Cached value or `null` when missing/expired.
   */
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

  /**
   * Write a cached session snapshot.
   * @param sessionId Session id.
   * @param value Cache value.
   * @returns True when stored; false when `sessionId` is missing.
   */
  set(sessionId: string | null | undefined, value: SessionValue) {
    if (!sessionId) return false;
    this.prune();
    const key = String(sessionId);
    this.map.set(key, { value, expires_at_ms: nowMs() + this.ttlMs });
    return true;
  }

  /**
   * Delete an entry by session id.
   * @param sessionId Session id.
   * @returns True when removed; false when missing/invalid.
   */
  del(sessionId: string | null | undefined) {
    if (!sessionId) return false;
    return this.map.delete(String(sessionId));
  }

  /**
   * Delete all entries belonging to a given user.
   * @param userId User id.
   * @returns Number of entries removed.
   */
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
