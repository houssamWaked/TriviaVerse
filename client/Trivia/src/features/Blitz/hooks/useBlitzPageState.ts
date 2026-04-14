import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { BlitzConfig, BlitzDifficulty, BlitzProps, DuelFriend } from '../types';

type UseBlitzPageStateArgs = Pick<
  BlitzProps,
  'user' | 'onRequireAuth' | 'onOpenDuel' | 'onPlaySession'
>;

export function useBlitzPageState({
  user,
  onRequireAuth,
  onOpenDuel,
  onPlaySession,
}: UseBlitzPageStateArgs) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<BlitzConfig | null>(null);
  const [difficulty, setDifficulty] = useState<BlitzDifficulty>('easy');
  const [duelOpen, setDuelOpen] = useState(false);
  const [duelFriends, setDuelFriends] = useState<DuelFriend[]>([]);
  const [duelFriendId, setDuelFriendId] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getBlitzConfig()
      .then((cfg) => {
        if (cancelled) return;
        if (cfg) setConfig(cfg);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const seconds = config?.time_limit_sec ?? 15;

  const diffMeta = useMemo(() => {
    if (difficulty === 'easy') {
      return {
        label: STRINGS.BLITZ.difficulty.easy,
        range: STRINGS.BLITZ.difficulty.range.easy,
      };
    }
    if (difficulty === 'medium') {
      return {
        label: STRINGS.BLITZ.difficulty.medium,
        range: STRINGS.BLITZ.difficulty.range.medium,
      };
    }
    return {
      label: STRINGS.BLITZ.difficulty.hard,
      range: STRINGS.BLITZ.difficulty.range.hard,
    };
  }, [difficulty]);

  const diffButtons = useMemo(
    () => [
      {
        key: 'easy',
        label: STRINGS.BLITZ.difficulty.easy,
        range: STRINGS.BLITZ.difficulty.range.easy,
      },
      {
        key: 'medium',
        label: STRINGS.BLITZ.difficulty.medium,
        range: STRINGS.BLITZ.difficulty.range.medium,
      },
      {
        key: 'hard',
        label: STRINGS.BLITZ.difficulty.hard,
        range: STRINGS.BLITZ.difficulty.range.hard,
      },
    ],
    []
  );

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.startBlitzSession({ difficulty });
      onPlaySession?.(res.session_id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleDuel = async () => {
    if (!user) return onRequireAuth?.('blitz');

    const next = !duelOpen;
    setDuelOpen(next);
    if (!next) return;
    if (duelFriends.length > 0) return;

    setBusy(true);
    setError('');
    try {
      const res = await api.listFriends();
      setDuelFriends(Array.isArray(res?.friends) ? res.friends : []);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('blitz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const closeDuel = () => {
    setDuelOpen(false);
    setDuelFriendId('');
  };

  const sendDuel = async () => {
    if (!user) return onRequireAuth?.('blitz');
    setBusy(true);
    setError('');
    try {
      const created = await api.createDuel({
        friend_user_id: duelFriendId,
        mode: 'blitz',
        difficulty,
      });
      setDuelOpen(false);
      setDuelFriendId('');
      onOpenDuel?.(created?.id);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('blitz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    error,
    seconds,
    difficulty,
    duelOpen,
    duelFriends,
    duelFriendId,
    diffMeta,
    diffButtons,
    setDifficulty,
    setDuelFriendId,
    start,
    toggleDuel,
    closeDuel,
    sendDuel,
  };
}
