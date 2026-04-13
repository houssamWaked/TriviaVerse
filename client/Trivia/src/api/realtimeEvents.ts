export type DuelChangedPayload = {
  type: 'created' | 'accepted' | 'declined' | 'canceled';
  duel: any;
};

/**
 * Realtime payload for per-duel live state updates.
 */
export type DuelStatePayload = {
  duelId: string;
  state: any;
};

/**
 * Realtime payload for session lifecycle updates.
 */
export type SessionChangedPayload = {
  type: 'answered' | 'lifeline_used' | 'finished';
  sessionId: string;
  finish?: any;
};

/**
 * Realtime payload for friend-request and friendship changes.
 */
export type FriendsChangedPayload = {
  reason: 'request_sent' | 'request_accepted' | 'request_declined' | 'request_canceled';
  byUserId: string;
  otherUserId?: string | null;
};

type RealtimeEventMap = {
  'socket:connected': null;
  'socket:disconnected': null;
  'duel:changed': DuelChangedPayload;
  'duel:state': DuelStatePayload;
  'session:changed': SessionChangedPayload;
  'friends:changed': FriendsChangedPayload;
};

type RealtimeEventName = keyof RealtimeEventMap;
type RealtimeListener<T extends RealtimeEventName> = (payload: RealtimeEventMap[T]) => void;

const listeners: {
  [K in RealtimeEventName]: Set<RealtimeListener<K>>;
} = {
  'socket:connected': new Set(),
  'socket:disconnected': new Set(),
  'duel:changed': new Set(),
  'duel:state': new Set(),
  'session:changed': new Set(),
  'friends:changed': new Set(),
};

/**
 * Emit an app-local realtime event to all subscribed listeners.
 * @param eventName Event name.
 * @param payload Event payload (typed by event name).
 * @returns Void.
 */
export function emitRealtimeEvent<T extends RealtimeEventName>(
  eventName: T,
  payload: RealtimeEventMap[T]
) {
  for (const listener of listeners[eventName]) {
    listener(payload);
  }
}

/**
 * Subscribe to an app-local realtime event.
 * @param eventName Event name.
 * @param listener Listener callback.
 * @returns Unsubscribe function.
 */
export function subscribeRealtimeEvent<T extends RealtimeEventName>(
  eventName: T,
  listener: RealtimeListener<T>
) {
  listeners[eventName].add(listener);

  return () => {
    listeners[eventName].delete(listener);
  };
}
