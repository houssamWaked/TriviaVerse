/**
 * Axios HTTP client configured for the TriviaVerse API.
 */
import axios from 'axios';
import { getAuthToken } from './tokenStore';

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3001';

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

