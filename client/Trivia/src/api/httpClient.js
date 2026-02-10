/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from './tokenStore';
import { endpoints } from './endpoints';
import { clearCurrentUser, getCurrentUser } from './userStore';

const envBase = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : '';
// Defaults:
// - dev: hit local API
// - prod: use same-origin relative `/api/...` (works on Vercel when API is hosted on same domain)
const baseURL = envBase || (import.meta.env.PROD ? '' : 'http://localhost:3001');

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

    // Don't hammer `/api/auth/refresh` when there's no access token to refresh.
    // (e.g. guest users hitting protected routes, or after we cleared the token.)
    const token = getAuthToken();
    if (!token) return Promise.reject(error);

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

      // If we thought we had a session but refresh can't restore it,
      // clear the persisted user so the UI doesn't look "logged in".
      if (getCurrentUser()) clearCurrentUser();
      return Promise.reject(error);
    }
  }
);
