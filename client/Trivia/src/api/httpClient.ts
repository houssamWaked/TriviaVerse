/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders,
} from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from './tokenStore';
import { endpoints } from './endpoints';
import { clearCurrentUser, getCurrentUser } from './userStore';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshBlockedError = Error & {
  code: 'REFRESH_BLOCKED';
  retry_after_ms: number;
};

const envBase =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : '';

const baseURL = import.meta.env.PROD ? '' : envBase || 'http://localhost:3001';

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/**
 * Attach the in-memory access token to every outgoing request.
 * @param config Axios request config.
 * @returns Updated config with `Authorization` header when a token is available.
 */
http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    const headers = AxiosHeaders.from(
      (config.headers ?? {}) as AxiosHeaders | RawAxiosRequestHeaders
    );
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

const authHttp = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise: Promise<string | undefined> | null = null;
let refreshBlockedUntilMs = 0;

/**
 * Extend the refresh "cooldown" window by a given duration.
 * @param ms Duration to block refresh attempts.
 * @returns Void.
 */
function blockRefresh(ms: number) {
  refreshBlockedUntilMs = Math.max(
    refreshBlockedUntilMs,
    Date.now() + Math.max(0, Number(ms) || 0)
  );
}

/**
 * Get remaining time in the current refresh cooldown window.
 * @returns Milliseconds remaining (0 when not blocked).
 */
function getRefreshBlockRemainingMs() {
  return Math.max(0, refreshBlockedUntilMs - Date.now());
}

/**
 * Refresh the access token using the server-managed httpOnly refresh cookie.
 * @returns The new access token (or undefined if missing in response).
 */
async function refreshAccessToken() {
  const remaining = getRefreshBlockRemainingMs();
  if (remaining > 0) {
    const error = new Error('Refresh temporarily blocked') as RefreshBlockedError;
    error.code = 'REFRESH_BLOCKED';
    error.retry_after_ms = remaining;
    throw error;
  }

  if (!refreshPromise) {
    refreshPromise = authHttp
      .post<{ token?: string }>(endpoints.refresh(), {})
      .then((response) => {
        const token = response?.data?.token;
        if (token) setAuthToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthEndpoint(url?: string | null) {
  const normalizedUrl = String(url || '');
  return (
    normalizedUrl.includes('/api/auth/login') ||
    normalizedUrl.includes('/api/auth/register') ||
    normalizedUrl.includes('/api/auth/google') ||
    normalizedUrl.includes('/api/auth/refresh') ||
    normalizedUrl.includes('/api/auth/logout') ||
    normalizedUrl.includes('/api/auth/verify-email') ||
    normalizedUrl.includes('/api/auth/resend-verification')
  );
}

http.interceptors.response.use(
  (response) => response,
  /**
   * Retry 401s once after a refresh, with backoff windows to prevent refresh storms.
   * @param error Axios error.
   * @returns A retried request result, or a rejected promise.
   */
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const config = error?.config as RetryableRequestConfig | undefined;

    if (!config || status !== 401) return Promise.reject(error);
    if (config._retry) return Promise.reject(error);
    if (isAuthEndpoint(config.url)) return Promise.reject(error);

    const token = getAuthToken();
    if (!token && !getCurrentUser()) return Promise.reject(error);

    config._retry = true;
    try {
      await refreshAccessToken();
      return http(config);
    } catch (refreshCause) {
      const refreshError = refreshCause as Partial<AxiosError> & Partial<RefreshBlockedError>;
      const refreshStatus = refreshError?.response?.status;

      if (refreshStatus === 429) {
        blockRefresh(5 * 60_000);
      } else if (refreshStatus === 401 || refreshStatus === 403) {
        blockRefresh(30_000);
      } else if (refreshError?.code === 'REFRESH_BLOCKED') {
        // Keep the existing block window.
      } else {
        blockRefresh(10_000);
      }

      clearAuthToken();

      if ((refreshStatus === 401 || refreshStatus === 403) && getCurrentUser()) {
        clearCurrentUser();
      }
      return Promise.reject(error);
    }
  }
);
