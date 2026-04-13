import { useEffect } from 'react';
import { emitRealtimeEvent } from './realtimeEvents';
import { getSocket, syncSocketAuth } from './socket';

type ClientRealtimeSyncProps = {
  enabled?: boolean;
};

/**
 * React-only bridge that connects the Socket.IO client and translates server events into
 * app-local realtime events (`emitRealtimeEvent`) so other UI code can subscribe.
 */
export default function ClientRealtimeSync({
  enabled = true,
}: ClientRealtimeSyncProps) {
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      emitRealtimeEvent('socket:connected', null);
    };

    const handleDisconnect = () => {
      emitRealtimeEvent('socket:disconnected', null);
    };

    const handleDuelChanged = (payload: any) => {
      emitRealtimeEvent('duel:changed', payload);
    };

    const handleDuelState = (payload: any) => {
      emitRealtimeEvent('duel:state', payload);
    };

    const handleSessionChanged = (payload: any) => {
      emitRealtimeEvent('session:changed', payload);
    };

    const handleFriendsChanged = (payload: any) => {
      emitRealtimeEvent('friends:changed', payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('duel:changed', handleDuelChanged);
    socket.on('duel:state', handleDuelState);
    socket.on('session:changed', handleSessionChanged);
    socket.on('friends:changed', handleFriendsChanged);

    if (enabled) {
      syncSocketAuth(socket);
      socket.connect();
    } else {
      socket.disconnect();
      emitRealtimeEvent('socket:disconnected', null);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('duel:changed', handleDuelChanged);
      socket.off('duel:state', handleDuelState);
      socket.off('session:changed', handleSessionChanged);
      socket.off('friends:changed', handleFriendsChanged);
      socket.disconnect();
      emitRealtimeEvent('socket:disconnected', null);
    };
  }, [enabled]);

  return null;
}
