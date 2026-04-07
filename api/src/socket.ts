import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

import { verifyAccessToken } from './utils/jwt.js';

type DuelChangedType = 'created' | 'accepted' | 'declined' | 'canceled';
type SessionChangedType = 'answered' | 'lifeline_used' | 'finished';

export type DuelChangedPayload = {
  type: DuelChangedType;
  duel: any;
};

export type DuelStatePayload = {
  duelId: string;
  state: any;
};

export type SessionChangedPayload = {
  type: SessionChangedType;
  sessionId: string;
  finish?: any;
};

type ServerToClientEvents = {
  'duel:changed': (payload: DuelChangedPayload) => void;
  'duel:state': (payload: DuelStatePayload) => void;
  'session:changed': (payload: SessionChangedPayload) => void;
};

type ClientToServerEvents = Record<string, never>;

type SocketData = {
  userId: string | null;
};

let io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null =
  null;

function normalizeOrigin(value: string | undefined) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/+$/, '');
}

function getAllowedOrigins() {
  const configured = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);

  if (configured.length > 0) return configured;

  const clientUrl = normalizeOrigin(process.env.CLIENT_URL);
  if (clientUrl) return [clientUrl];

  return ['http://localhost:5173'];
}

function getSocketToken(socket: {
  handshake: {
    auth?: Record<string, unknown>;
    headers?: Record<string, unknown>;
  };
}) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim().replace(/^Bearer\s+/i, '');
  }

  const header =
    typeof socket.handshake.headers?.authorization === 'string'
      ? socket.handshake.headers.authorization
      : '';
  return header.trim().replace(/^Bearer\s+/i, '') || null;
}

function userRoom(userId: string) {
  return `user:${String(userId)}`;
}

function emitToUser(userId: string | null | undefined, event: keyof ServerToClientEvents, payload: any) {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
}

function emitToDuelParticipants(
  duelLike: { challenger_user_id?: string | null; opponent_user_id?: string | null } | null | undefined,
  event: keyof ServerToClientEvents,
  payload: any
) {
  const ids = Array.from(
    new Set([duelLike?.challenger_user_id, duelLike?.opponent_user_id].filter(Boolean))
  );
  for (const userId of ids) {
    emitToUser(String(userId), event, payload);
  }
}

export function initializeSocket(server: HttpServer) {
  if (io) return io;

  const allowedOrigins = getAllowedOrigins();

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    server,
    {
      cors: {
        origin(origin, callback) {
          if (!origin) return callback(null, true);
          const normalizedOrigin = normalizeOrigin(origin);
          if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
          }
          return callback(new Error('CORS origin not allowed'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
      },
    }
  );

  io.on('connection', (socket) => {
    const token = getSocketToken(socket);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        socket.data.userId = decoded.sub;
        socket.join(userRoom(decoded.sub));
      } catch {
        socket.data.userId = null;
      }
    } else {
      socket.data.userId = null;
    }

    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIo() {
  return io;
}

export function emitDuelChanged(type: DuelChangedType, duel: any) {
  if (!io || !duel?.id) return;

  emitToDuelParticipants(duel, 'duel:changed', {
    type,
    duel,
  });
}

export function emitDuelStateChanged(duelId: string, state: any) {
  if (!io || !duelId || !state) return;

  emitToDuelParticipants(state, 'duel:state', {
    duelId: String(duelId),
    state,
  });
}

export function emitSessionChanged(
  type: SessionChangedType,
  sessionId: string,
  userId: string | null | undefined,
  finish?: any
) {
  if (!io || !sessionId || !userId) return;

  emitToUser(userId, 'session:changed', {
    type,
    sessionId: String(sessionId),
    ...(finish !== undefined ? { finish } : {}),
  });
}
