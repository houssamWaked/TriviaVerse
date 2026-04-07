import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './tokenStore';

const rawSocketUrl =
  (import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')) ?? '';

const SOCKET_URL = String(rawSocketUrl).replace(/\/+$/, '');

let socket: Socket | null = null;

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

export function syncSocketAuth(target = getSocket()) {
  const token = getAuthToken();
  target.auth = token ? { token } : {};
  return target;
}
