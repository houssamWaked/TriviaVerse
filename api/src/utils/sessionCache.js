/**
 * In-memory session cache for "flash-fast" gameplay.
 *
 * Notes:
 * - This is process-local (not shared across multiple server instances).
 * - Safe fallback: when cache misses, the service falls back to DB reads.
 * - We only use this for performance; DB remains the source of truth for persistence.
 */

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function nowMs() {
  return Date.now();
}

export class SessionCache {
  constructor({ ttlMs = DEFAULT_TTL_MS } = {}) {
    this.ttlMs = Math.max(10_000, Number(ttlMs) || DEFAULT_TTL_MS);
    this.map = new Map();
  }

  _prune() {
    const t = nowMs();
    for (const [k, v] of this.map.entries()) {
      if (!v || (Number.isFinite(Number(v.expires_at_ms)) && v.expires_at_ms <= t)) {
        this.map.delete(k);
      }
    }
  }

  get(sessionId) {
    if (!sessionId) return null;
    this._prune();
    const v = this.map.get(String(sessionId));
    if (!v) return null;
    if (Number.isFinite(Number(v.expires_at_ms)) && v.expires_at_ms <= nowMs()) {
      this.map.delete(String(sessionId));
      return null;
    }
    return v.value || null;
  }

  set(sessionId, value) {
    if (!sessionId) return false;
    this._prune();
    const key = String(sessionId);
    this.map.set(key, { value, expires_at_ms: nowMs() + this.ttlMs });
    return true;
  }

  del(sessionId) {
    if (!sessionId) return false;
    return this.map.delete(String(sessionId));
  }
}

export const sessionCache = new SessionCache();

