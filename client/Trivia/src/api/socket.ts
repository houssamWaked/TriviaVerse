import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './tokenStore';

/**
 * Socket.IO client helper for realtime updates (sessions, duels, etc.).
 *
 * The socket is lazily created and reused across the app.
 */
const rawSocketUrl =
  (import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')) ?? '';

const SOCKET_URL = String(rawSocketUrl).replace(/\/+$/, '');

let socket: Socket | null = null;

/**
 * Get the singleton Socket.IO client instance (not auto-connected).
 * @returns Socket instance.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
  }

  return socket;
}

/**
 * Sync the current access token into a socket's auth payload.
 * @param target Socket instance (defaults to the singleton).
 * @returns The same socket instance for chaining.
 */
export function syncSocketAuth(target = getSocket()) {
  const token = getAuthToken();
  target.auth = token ? { token } : {};
  return target;
}
