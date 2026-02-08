/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from './tokenStore';
import { endpoints } from './endpoints';

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
async function refreshAccessToken() {
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

    config._retry = true;
    try {
      await refreshAccessToken();
      return http(config);
    } catch (e) {
      clearAuthToken();
      return Promise.reject(error);
    }
  }
);
