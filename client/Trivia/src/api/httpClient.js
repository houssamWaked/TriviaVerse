/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from './tokenStore';
import { endpoints } from './endpoints';
import { clearCurrentUser, getCurrentUser } from './userStore';

const envBase =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : '';
// Defaults:
// - dev: hit local API (or an explicit VITE_API_BASE_URL)
// - prod: always use same-origin relative `/api/...` so refresh cookies remain first-party
//   (use Vercel rewrites / a reverse proxy to forward `/api/*` to your backend).
const baseURL = import.meta.env.PROD ? '' : envBase || 'http://localhost:3001';

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authHttp = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise = null;
let refreshBlockedUntilMs = 0;

function blockRefresh(ms) {
  refreshBlockedUntilMs = Math.max(refreshBlockedUntilMs, Date.now() + Math.max(0, Number(ms) || 0));
}

function getRefreshBlockRemainingMs() {
  return Math.max(0, refreshBlockedUntilMs - Date.now());
}

async function refreshAccessToken() {
  const remaining = getRefreshBlockRemainingMs();
  if (remaining > 0) {
    const err = new Error('Refresh temporarily blocked');
    err.code = 'REFRESH_BLOCKED';
    err.retry_after_ms = remaining;
    throw err;
  }

  if (!refreshPromise) {
    refreshPromise = authHttp
      .post(endpoints.refresh(), {})
      .then((res) => {
        const token = res?.data?.token;
        if (token) setAuthToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isAuthEndpoint(url) {
  const u = String(url || '');
  return (
    u.includes('/api/auth/login') ||
    u.includes('/api/auth/register') ||
    u.includes('/api/auth/google') ||
    u.includes('/api/auth/refresh') ||
    u.includes('/api/auth/logout') ||
    u.includes('/api/auth/verify-email') ||
    u.includes('/api/auth/resend-verification')
  );
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config;

    if (!config || status !== 401) return Promise.reject(error);
    if (config._retry) return Promise.reject(error);
    if (isAuthEndpoint(config.url)) return Promise.reject(error);

    // Don't hammer `/api/auth/refresh` when we clearly don't have a session.
    // If a user snapshot exists (localStorage) but the access token is missing
    // (e.g. mobile tab discard), allow one refresh attempt to restore the session.
    const token = getAuthToken();
    if (!token && !getCurrentUser()) return Promise.reject(error);

    config._retry = true;
    try {
      await refreshAccessToken();
      return http(config);
    } catch (e) {
      const refreshStatus = e?.response?.status;
      if (refreshStatus === 429) {
        // Back off for a while to avoid tripping auth rate limits repeatedly.
        blockRefresh(5 * 60_000);
      } else if (refreshStatus === 401 || refreshStatus === 403) {
        // Cookie missing/expired or user is blocked. Avoid immediate retry loops.
        blockRefresh(30_000);
      } else if (e?.code === 'REFRESH_BLOCKED') {
        // keep existing block window
      } else {
        // Network-ish: short backoff.
        blockRefresh(10_000);
      }

      clearAuthToken();

      // Only clear the persisted user when the server explicitly says the session
      // cannot be refreshed (cookie missing/expired, blocked, etc). For transient
      // failures (network/5xx), keep the user snapshot so the app can recover.
      if ((refreshStatus === 401 || refreshStatus === 403) && getCurrentUser()) {
        clearCurrentUser();
      }
      return Promise.reject(error);
    }
  }
);
