export type DuelChangedPayload = {
  type: 'created' | 'accepted' | 'declined' | 'canceled';
  duel: any;
};

export type DuelStatePayload = {
  duelId: string;
  state: any;
};

export type SessionChangedPayload = {
  type: 'answered' | 'lifeline_used' | 'finished';
  sessionId: string;
  finish?: any;
};

type RealtimeEventMap = {
  'socket:connected': null;
  'socket:disconnected': null;
  'duel:changed': DuelChangedPayload;
  'duel:state': DuelStatePayload;
  'session:changed': SessionChangedPayload;
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
};

export function emitRealtimeEvent<T extends RealtimeEventName>(
  eventName: T,
  payload: RealtimeEventMap[T]
) {
  for (const listener of listeners[eventName]) {
    listener(payload);
  }
}

export function subscribeRealtimeEvent<T extends RealtimeEventName>(
  eventName: T,
  listener: RealtimeListener<T>
) {
  listeners[eventName].add(listener);

  return () => {
    listeners[eventName].delete(listener);
  };
}
