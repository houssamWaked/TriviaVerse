import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { subscribeRealtimeEvent } from '@/api/realtimeEvents';
import { getApiErrorMessage } from '@/utils/apiError';
import type { AppUser, FriendRequest, FriendRow } from '@/features/Friends/types';

export function useFriendsData(user?: AppUser) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);

  const load = useCallback(async (showBusy = true) => {
    if (showBusy) {
      setBusy(true);
      setError('');
    }
    try {
      const [friendsRes, reqRes] = await Promise.all([
        api.listFriends(),
        api.listFriendRequests(),
      ]);
      setFriends(Array.isArray(friendsRes?.friends) ? friendsRes.friends : []);
      setIncoming(Array.isArray(reqRes?.incoming) ? reqRes.incoming : []);
      setOutgoing(Array.isArray(reqRes?.outgoing) ? reqRes.outgoing : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      if (showBusy) {
        setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleFriendsChanged = () => {
      void load(false);
    };

    const handleConnected = () => {
      void load(false);
    };

    void load();
    const offFriendsChanged = subscribeRealtimeEvent('friends:changed', handleFriendsChanged);
    const offConnected = subscribeRealtimeEvent('socket:connected', handleConnected);

    return () => {
      offFriendsChanged();
      offConnected();
    };
  }, [load, user]);

  const normalizedUsername = useMemo(() => String(username || '').trim(), [username]);

  const send = useCallback(async () => {
    const nextUsername = normalizedUsername;
    if (!nextUsername) return;
    setBusy(true);
    setError('');
    try {
      await api.sendFriendRequest({ username: nextUsername });
      setUsername('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [load, normalizedUsername]);

  const accept = useCallback(
    async (requestId: string) => {
      setBusy(true);
      setError('');
      try {
        await api.acceptFriendRequest(requestId);
        await load();
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const decline = useCallback(
    async (requestId: string) => {
      setBusy(true);
      setError('');
      try {
        await api.declineFriendRequest(requestId);
        await load();
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const cancel = useCallback(
    async (requestId: string) => {
      setBusy(true);
      setError('');
      try {
        await api.cancelFriendRequest(requestId);
        await load();
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  return {
    busy,
    error,
    username,
    normalizedUsername,
    friends,
    incoming,
    outgoing,
    setUsername,
    load,
    send,
    accept,
    decline,
    cancel,
  };
}
