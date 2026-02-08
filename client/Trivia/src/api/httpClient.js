/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios from 'axios';
import { getAuthToken } from './tokenStore';

const envBase = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : '';
// Defaults:
// - dev: hit local API
// - prod: use same-origin relative `/api/...` (works on Vercel when API is hosted on same domain)
const baseURL = envBase || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
