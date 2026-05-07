import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import { subscribeRealtimeEvent } from '@/api/realtimeEvents';
import ProfileStyle from '@/Styles/ComponentStyles/ProfileStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import type { AppDispatch, RootState } from '@/store';
import { loadMyProfile, setProfileError } from '@/store/slices/profileSlice';
import type { DuelEntry, PlayedQuiz, ProfileData, ProfileProps } from '@/features/Profile/types';

type DuelStatePayload = {
  id?: string | null;
  status?: string | null;
  mode?: string | null;
  challenger_user_id?: string | null;
  opponent_user_id?: string | null;
  winner_user_id?: string | null;
  challenger_points?: number | null;
  opponent_points?: number | null;
  started_at?: string | null;
  current_index?: number | null;
  ms_until_start?: number | null;
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return STRINGS.COMMON.separators.emDash;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return STRINGS.COMMON.separators.emDash;
  return t.toLocaleDateString();
}

function initials(username: string | null | undefined) {
  const u = String(username || '').trim();
  if (!u) return STRINGS.PROFILE.initialsFallback;
  return u.slice(0, 1).toUpperCase();
}

function modeLabel(mode: string | null | undefined) {
  if (mode === 'story') return STRINGS.PROFILE.modes.story;
  if (mode === 'classic') return STRINGS.PROFILE.modes.classic;
  if (mode === 'blitz') return STRINGS.PROFILE.modes.blitz;
  if (mode === 'millionaire') return STRINGS.PROFILE.modes.millionaire;
  if (mode === 'custom') return STRINGS.PROFILE.modes.custom;
  return mode;
}

function modeIcon(mode: string | null | undefined) {
  if (mode === 'story') return ICONS.common.openBook;
  if (mode === 'classic') return ICONS.common.bookmark;
  if (mode === 'blitz') return ICONS.common.bolt;
  if (mode === 'millionaire') return ICONS.common.crownGold;
  if (mode === 'custom') return ICONS.common.gamepad;
  return ICONS.common.user;
}

function getMeRole(d: DuelEntry, myUserId: string | undefined) {
  if (myUserId && d?.challenger_user_id === myUserId) return 'challenger';
  if (myUserId && d?.opponent_user_id === myUserId) return 'opponent';
  return d?.me_role || null;
}

function getOpponentName(d: DuelEntry, myUserId: string | undefined) {
  const meRole = getMeRole(d, myUserId);
  if (meRole === 'challenger') return d?.opponent_user?.username || STRINGS.COMMON.playerFallback;
  return d?.challenger_user?.username || STRINGS.COMMON.playerFallback;
}

function statusText(d: DuelEntry) {
  const s = String(d?.status || '');
  if (!s) return STRINGS.COMMON.separators.emDash;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusPillStyle(d: DuelEntry) {
  const s = String(d?.status || '');
  if (s === 'completed') return { ...ProfileStyle.statusPill, ...ProfileStyle.statusPillGood };
  if (s === 'declined' || s === 'canceled') {
    return { ...ProfileStyle.statusPill, ...ProfileStyle.statusPillBad };
  }
  return ProfileStyle.statusPill;
}

function duelResultText(d: DuelEntry, myUserId: string | undefined) {
  if (d?.status !== 'completed') return '';
  if (!d?.winner_user_id) return STRINGS.PROFILE.duels.result.tie;
  if (d.winner_user_id === myUserId) return STRINGS.PROFILE.duels.result.youWon;
  return STRINGS.PROFILE.duels.result.youLost;
}

function sortDuelsNewestFirst(entries: DuelEntry[]) {
  return [...entries].sort((left, right) => {
    const leftTs = left?.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTs = right?.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTs - leftTs;
  });
}

function upsertDuelEntry(entries: DuelEntry[], nextEntry: DuelEntry) {
  const duelId = String(nextEntry?.id || '').trim();
  if (!duelId) return entries;

  const index = entries.findIndex((entry) => String(entry?.id || '') === duelId);
  if (index < 0) {
    return sortDuelsNewestFirst([nextEntry, ...entries]);
  }

  const next = [...entries];
  next[index] = {
    ...next[index],
    ...nextEntry,
  };
  return sortDuelsNewestFirst(next);
}

function mergeDuelState(
  entries: DuelEntry[],
  state: DuelStatePayload | null | undefined,
  duelId: string | null | undefined
) {
  const resolvedDuelId = String(state?.id || duelId || '').trim();
  if (!resolvedDuelId) return entries;

  return upsertDuelEntry(entries, {
    id: resolvedDuelId,
    status: state?.status ?? undefined,
    mode: state?.mode ?? undefined,
    challenger_user_id: state?.challenger_user_id ?? undefined,
    opponent_user_id: state?.opponent_user_id ?? undefined,
    winner_user_id: state?.winner_user_id ?? undefined,
    challenger_points: state?.challenger_points ?? undefined,
    opponent_points: state?.opponent_points ?? undefined,
    started_at: state?.started_at ?? undefined,
    current_index: state?.current_index ?? undefined,
    ms_until_start: state?.ms_until_start ?? undefined,
  });
}

type UseProfileStateParams = Pick<
  ProfileProps,
  'user' | 'friendUserId' | 'onRequireAuth' | 'onOpenDuel'
>;

export function useProfileState({ user, friendUserId, onRequireAuth, onOpenDuel }: UseProfileStateParams) {
  const isFriendView = !!friendUserId;
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const [localBusy, setLocalBusy] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [friendData, setFriendData] = useState<ProfileData | null>(null);
  const [plays, setPlays] = useState<PlayedQuiz[]>([]);
  const [playsFilter, setPlaysFilter] = useState('');
  const [duels, setDuels] = useState<DuelEntry[]>([]);
  const autoOpenedRef = useRef<Set<string>>(new Set());

  const loadProfile = async () => {
    setLocalBusy(true);
    setFriendError('');
    try {
      if (isFriendView) {
        const res = await api.getFriendProfile(friendUserId);
        setFriendData(res);
      } else {
        await dispatch(loadMyProfile()).unwrap();
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      const message = getApiErrorMessage(err);
      if (isFriendView) {
        setFriendError(message);
        setFriendData(null);
      } else {
        dispatch(setProfileError(message));
      }
    } finally {
      setLocalBusy(false);
    }
  };

  const loadPlays = async () => {
    try {
      const res = (await api.listMyPlayedQuizzes()) as {
        entries?: PlayedQuiz[];
      };
      setPlays(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      if (isFriendView) setFriendError(getApiErrorMessage(err));
      else dispatch(setProfileError(getApiErrorMessage(err)));
      setPlays([]);
    }
  };

  const loadDuels = async () => {
    try {
      const res = (await api.listDuels()) as {
        entries?: DuelEntry[];
      };
      const list = Array.isArray(res?.entries) ? res.entries : [];
      setDuels(sortDuelsNewestFirst(list));
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      if (isFriendView) setFriendError(getApiErrorMessage(err));
      else dispatch(setProfileError(getApiErrorMessage(err)));
      setDuels([]);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadProfile(), loadPlays(), loadDuels()]);
  };

  useEffect(() => {
    if (!user) return;

    if (isFriendView) {
      void loadProfile();
      return;
    }

    const handleDuelChanged = (payload: { duel?: DuelEntry | null }) => {
      const nextEntry = payload?.duel;
      if (!nextEntry?.id) return;
      setDuels((previous) => upsertDuelEntry(previous, nextEntry));
    };

    const handleDuelState = (payload: { duelId?: string; state?: DuelStatePayload | null }) => {
      setDuels((previous) => mergeDuelState(previous, payload?.state, payload?.duelId));
    };

    const handleConnected = () => {
      void loadDuels();
    };

    void loadAll();
    const offChanged = subscribeRealtimeEvent('duel:changed', handleDuelChanged);
    const offState = subscribeRealtimeEvent('duel:state', handleDuelState);
    const offConnected = subscribeRealtimeEvent('socket:connected', handleConnected);

    return () => {
      offChanged();
      offState();
      offConnected();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user, friendUserId]);

  useEffect(() => {
    if (isFriendView) return;
    if (!onOpenDuel) return;

    const toAutoOpen = duels.find(
      (d) =>
        d?.status === 'active' &&
        getMeRole(d, user?.id) === 'challenger' &&
        !autoOpenedRef.current.has(d.id) &&
        Number(d?.ms_until_start) > 0 &&
        Number(d?.ms_until_start) <= 3200
    );

    if (!toAutoOpen?.id) return;
    autoOpenedRef.current.add(toAutoOpen.id);
    onOpenDuel(toAutoOpen.id);
  }, [duels, isFriendView, onOpenDuel, user?.id]);

  const busy = isFriendView ? localBusy : localBusy || profile.busy;
  const error = isFriendView ? friendError : profile.error;
  const data = isFriendView ? friendData : profile.data;
  const setBusy = setLocalBusy;
  const setError = (message: string) => {
    if (isFriendView) setFriendError(message);
    else dispatch(setProfileError(message));
  };

  const name = useMemo(
    () => data?.user?.username || user?.username || STRINGS.COMMON.playerFallback,
    [data?.user?.username, user?.username]
  );
  const avatarUrl = data?.user?.avatar_url || user?.avatar_url || '';
  const email = data?.user?.email || user?.email || '';
  const stats = data?.user_stats || {};
  const modeSummary = useMemo(() => data?.mode_summary?.by_mode || {}, [data?.mode_summary?.by_mode]);
  const story = data?.story_progress || null;

  const modeCards = useMemo(() => {
    const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'];
    return modes.map((m) => {
      const s = (modeSummary?.[m] || {}) as Record<string, unknown>;
      return {
        mode: m,
        label: modeLabel(m),
        icon: modeIcon(m),
        played: Number(s.played ?? 0),
        completed: Number(s.completed ?? 0),
        best: Number(s.best_score ?? 0),
        last: (s.last_played_at as string | null | undefined) ?? null,
      };
    });
  }, [modeSummary]);

  const filteredPlays = useMemo(() => {
    const f = String(playsFilter || '').trim().toLowerCase();
    if (!f) return plays;
    return (plays || []).filter((e) => String(e.title || '').toLowerCase().includes(f));
  }, [plays, playsFilter]);

  return {
    busy,
    setBusy,
    error,
    setError,
    data,
    playsFilter,
    setPlaysFilter,
    duels,
    isFriendView,
    loadProfile,
    loadDuels,
    loadAll,
    name,
    avatarUrl,
    email,
    stats,
    story,
    modeCards,
    filteredPlays,
    formatDate,
    initials,
    getMeRole,
    getOpponentName,
    duelResultText,
    statusPillStyle,
    statusText,
  };
}
