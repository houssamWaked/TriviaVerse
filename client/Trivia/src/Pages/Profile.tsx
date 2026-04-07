import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import { subscribeRealtimeEvent } from '@/api/realtimeEvents';
import ProfileStyle from '@/Styles/ComponentStyles/ProfileStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type AppUser = {
  id?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
} | null;

type ProfileData = {
  user?: {
    username?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
  user_stats?: {
    level?: number | null;
    xp_total?: number | null;
    streak_days?: number | null;
  } | null;
  mode_summary?: {
    by_mode?: Record<string, Record<string, unknown>>;
  } | null;
  story_progress?: {
    completed_levels?: number | null;
    total_levels?: number | null;
  } | null;
  custom_quiz_best?: Array<{
    quiz_id: string;
    title?: string | null;
    best_score?: number | null;
    updated_at?: string | null;
  }>;
};

type PlayedQuiz = {
  quiz_id: string;
  title?: string | null;
  best_score?: number | null;
  visibility?: string | null;
  updated_at?: string | null;
};

type DuelEntry = {
  id: string;
  status?: string | null;
  me_role?: string | null;
  challenger_user_id?: string | null;
  opponent_user_id?: string | null;
  winner_user_id?: string | null;
  opponent_user?: { username?: string | null } | null;
  challenger_user?: { username?: string | null } | null;
  quiz?: { title?: string | null } | null;
  mode?: string | null;
  difficulty?: string | null;
  challenger_points?: number | null;
  opponent_points?: number | null;
  created_at?: string | null;
  started_at?: string | null;
  current_index?: number | null;
  ms_until_start?: number | null;
};

type ProfileProps = {
  user?: AppUser;
  friendUserId?: string | null;
  onRequireAuth?: () => void;
  onNavigateHome?: () => void;
  onOpenQuiz?: (quizId?: string) => void;
  onOpenDuel?: (duelId?: string) => void;
  onBack?: () => void;
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

function mergeDuelState(entries: DuelEntry[], state: any, duelId: string | null | undefined) {
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

export default function Profile({
  user,
  friendUserId,
  onRequireAuth,
  onNavigateHome,
  onOpenQuiz,
  onOpenDuel,
  onBack,
}: ProfileProps) {
  const isFriendView = !!friendUserId;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [data, setData] = useState<ProfileData | null>(null);
  const [plays, setPlays] = useState<PlayedQuiz[]>([]);
  const [playsFilter, setPlaysFilter] = useState('');
  const [duels, setDuels] = useState<DuelEntry[]>([]);
  const autoOpenedRef = useRef<Set<string>>(new Set());

  const loadProfile = async () => {
    setBusy(true);
    setError('');
    try {
      const res = isFriendView ? await api.getFriendProfile(friendUserId) : await api.getMyProfile();
      setData(res);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.();
      setError(getApiErrorMessage(err));
      setData(null);
    } finally {
      setBusy(false);
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
      setError(getApiErrorMessage(err));
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
      setError(getApiErrorMessage(err));
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

    const handleDuelState = (payload: { duelId?: string; state?: any }) => {
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

  const name = useMemo(
    () => data?.user?.username || user?.username || STRINGS.COMMON.playerFallback,
    [data?.user?.username, user?.username]
  );
  const avatarUrl = data?.user?.avatar_url || user?.avatar_url || '';
  const email = data?.user?.email || user?.email || '';
  const stats = data?.user_stats || {};
  const modeSummary = data?.mode_summary?.by_mode || {};
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

  if (!user) {
    return (
      <div style={ProfileStyle.page}>
        <div style={ProfileStyle.container}>
          <div className="tv-card" style={ProfileStyle.lockCard}>
            <h2 style={ProfileStyle.lockTitle}>{STRINGS.PROFILE.locked.title}</h2>
            <p style={ProfileStyle.lockText}>{STRINGS.PROFILE.locked.subtitle}</p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ProfileStyle.primaryBtnMain}
              onClick={() => onRequireAuth?.()}
            >
              {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ProfileStyle.secondaryBtnWhite}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ProfileStyle.page}>
      <div style={ProfileStyle.container}>
        <div style={ProfileStyle.topRow}>
          <div style={ProfileStyle.topActions}>
            {isFriendView && onBack && (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={ProfileStyle.btnWhite}
                onClick={onBack}
                disabled={busy}
              >
                {STRINGS.COMMON.symbols.leftArrow} {STRINGS.COMMON.buttons.back}
              </button>
            )}
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ProfileStyle.btnWhite}
              onClick={() => (isFriendView ? loadProfile() : loadAll())}
              disabled={busy}
            >
              {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
            </button>
          </div>
          <div style={ProfileStyle.topActions}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ProfileStyle.btnPrimary}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>
        </div>

        {!!error && <div style={ProfileStyle.errorCard}>{error}</div>}

        <div className="tv-card" style={ProfileStyle.headerCard}>
          <div style={ProfileStyle.headerTop}>
            <div style={ProfileStyle.avatar} aria-label={STRINGS.PROFILE.aria.avatar}>
              {avatarUrl ? (
                <img alt={name} src={avatarUrl} style={ProfileStyle.avatarImg} />
              ) : (
                initials(name)
              )}
            </div>
            <div style={ProfileStyle.nameWrap}>
              <h1 style={ProfileStyle.name}>{name}</h1>
              <div style={ProfileStyle.sub}>
                {busy ? STRINGS.PROFILE.header.loading : STRINGS.PROFILE.header.subtitle}{' '}
                {!isFriendView && !!email && (
                  <>
                    {STRINGS.COMMON.separators.dot} {ICONS.common.mail} {email}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={ProfileStyle.pills}>
            <div style={ProfileStyle.pill}>
              {ICONS.common.star} {STRINGS.PROFILE.pills.level} {stats.level ?? 1}
            </div>
            <div style={ProfileStyle.pill}>
              {ICONS.common.brain} {STRINGS.PROFILE.pills.xp} {stats.xp_total ?? 0}
            </div>
            <div style={ProfileStyle.pill}>
              {ICONS.common.fire} {STRINGS.PROFILE.pills.streak} {stats.streak_days ?? 0}
              {STRINGS.PROFILE.pills.streakSuffix}
            </div>
            {story && (
              <div style={ProfileStyle.pill}>
                {ICONS.common.openBook} {STRINGS.PROFILE.pills.story}{' '}
                {story.completed_levels ?? 0}/{story.total_levels ?? 0}
              </div>
            )}
          </div>
        </div>

        <div style={ProfileStyle.grid}>
          {modeCards.map((c) => (
            <div key={c.mode} className="tv-card" style={ProfileStyle.modeCard}>
              <div style={ProfileStyle.modeTop}>
                <h2 style={ProfileStyle.modeTitle}>
                  <span style={ProfileStyle.modeIcon}>{c.icon}</span>
                  {c.label}
                </h2>
              </div>

              <div style={ProfileStyle.modeMeta}>
                <div style={ProfileStyle.stat}>
                  <div style={ProfileStyle.statLabel}>{STRINGS.PROFILE.stats.played}</div>
                  <div style={ProfileStyle.statValue}>{c.played}</div>
                </div>
                <div style={ProfileStyle.stat}>
                  <div style={ProfileStyle.statLabel}>{STRINGS.PROFILE.stats.completed}</div>
                  <div style={ProfileStyle.statValue}>{c.completed}</div>
                </div>
                <div style={ProfileStyle.stat}>
                  <div style={ProfileStyle.statLabel}>{STRINGS.PROFILE.stats.best}</div>
                  <div style={ProfileStyle.statValue}>{c.best}</div>
                </div>
                <div style={ProfileStyle.stat}>
                  <div style={ProfileStyle.statLabel}>{STRINGS.PROFILE.stats.lastPlayed}</div>
                  <div style={ProfileStyle.statValue}>{formatDate(c.last)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="tv-card" style={ProfileStyle.sectionCard}>
          <h2 style={ProfileStyle.sectionTitle}>{STRINGS.PROFILE.customBest.title}</h2>
          <div style={ProfileStyle.sectionSub}>{STRINGS.PROFILE.customBest.subtitle}</div>

          <div style={ProfileStyle.list}>
            {(data?.custom_quiz_best || []).slice(0, 12).map((e) => (
              <button
                key={e.quiz_id}
                type="button"
                className="tv-card tv-card--hover"
                style={ProfileStyle.item}
                onClick={() => onOpenQuiz?.(e.quiz_id)}
                disabled={busy || !onOpenQuiz}
              >
                <div style={ProfileStyle.itemTop}>
                  <div style={ProfileStyle.itemTitle}>{e.title}</div>
                  <div style={ProfileStyle.scorePill}>
                    {ICONS.common.trophy} {e.best_score}
                  </div>
                </div>
                <div style={ProfileStyle.meta}>
                  {STRINGS.PROFILE.customBest.updatedPrefix} {formatDate(e.updated_at)}
                </div>
              </button>
            ))}

            {!busy && (data?.custom_quiz_best || []).length === 0 && (
              <div style={ProfileStyle.meta}>{STRINGS.PROFILE.customBest.empty}</div>
            )}
          </div>
        </div>

        {!isFriendView && (
          <div className="tv-card" style={ProfileStyle.sectionCard}>
            <div style={ProfileStyle.sectionTopRow}>
              <div>
                <h2 style={ProfileStyle.sectionTitle}>{STRINGS.PROFILE.plays.title}</h2>
                <div style={ProfileStyle.sectionSub}>{STRINGS.PROFILE.plays.subtitle}</div>
              </div>
              <input
                style={ProfileStyle.input}
                value={playsFilter}
                onChange={(e) => setPlaysFilter(e.target.value)}
                placeholder={STRINGS.PROFILE.plays.searchPlaceholder}
                disabled={busy}
              />
            </div>

            <div style={ProfileStyle.list}>
              {filteredPlays.slice(0, 30).map((e) => (
                <button
                  key={e.quiz_id}
                  type="button"
                  className="tv-card tv-card--hover"
                  style={ProfileStyle.item}
                  onClick={() => onOpenQuiz?.(e.quiz_id)}
                  disabled={busy || !onOpenQuiz}
                >
                  <div style={ProfileStyle.itemTop}>
                    <div style={ProfileStyle.itemTitle}>{e.title}</div>
                    <div style={ProfileStyle.scorePill}>
                      {ICONS.common.medal} {e.best_score ?? 0}
                    </div>
                  </div>
                  <div style={ProfileStyle.meta}>
                    {e.visibility === STRINGS.COMMON.visibility.private
                      ? `${ICONS.common.lock} ${STRINGS.COMMON.visibility.private}`
                      : `${ICONS.common.globe} ${STRINGS.COMMON.visibility.public}`}{' '}
                    {STRINGS.COMMON.separators.dot} {ICONS.common.calendar} {formatDate(e.updated_at)}
                  </div>
                </button>
              ))}

              {!busy && filteredPlays.length === 0 && (
                <div style={ProfileStyle.meta}>{STRINGS.PROFILE.plays.empty}</div>
              )}
            </div>
          </div>
        )}

        {!isFriendView && (
          <div className="tv-card" style={ProfileStyle.sectionCard}>
            <h2 style={ProfileStyle.sectionTitle}>{STRINGS.PROFILE.duels.title}</h2>
            <div style={ProfileStyle.sectionSub}>{STRINGS.PROFILE.duels.subtitle}</div>

            <div style={ProfileStyle.list}>
              {(duels || []).slice(0, 30).map((d) => {
                const meRole = getMeRole(d, user?.id);
                const oppName = getOpponentName(d, user?.id);
                const canAccept = d?.status === 'pending' && meRole === 'opponent';
                const canDecline = d?.status === 'pending' && meRole === 'opponent';
                const canCancel = d?.status === 'pending' && meRole === 'challenger';
                const canOpen = d?.status === 'active' || d?.status === 'completed';
                const resultText = duelResultText(d, user?.id);

                return (
                  <div key={d.id} style={ProfileStyle.itemStatic}>
                    <div style={ProfileStyle.itemTop}>
                      <div style={ProfileStyle.itemTitle}>
                        {STRINGS.PROFILE.duels.vsPrefix} {oppName}
                      </div>
                      <span style={statusPillStyle(d)}>{statusText(d)}</span>
                    </div>

                    <div style={ProfileStyle.meta}>
                      {d?.quiz?.title ||
                        (String(d?.mode || '').toLowerCase() === 'blitz'
                          ? STRINGS.PROFILE.duels.blitzLabel(d?.difficulty || null)
                          : STRINGS.COMMON.separators.emDash)}
                      {STRINGS.COMMON.separators.dot} {ICONS.common.trophy}{' '}
                      {d?.challenger_points ?? 0}:{d?.opponent_points ?? 0}
                      {resultText ? ` ${STRINGS.COMMON.separators.dot} ${resultText}` : ''}
                    </div>

                    <div style={ProfileStyle.row}>
                      <div style={ProfileStyle.meta}>
                        {ICONS.common.calendar} {formatDate(d?.created_at)}
                      </div>

                      <div style={ProfileStyle.miniActions}>
                        {canOpen && (
                          <button
                            type="button"
                            style={ProfileStyle.miniBtnPrimary}
                            disabled={busy || !onOpenDuel}
                            onClick={() => onOpenDuel?.(d.id)}
                          >
                            {STRINGS.PROFILE.duels.buttons.open} {ICONS.common.play}
                          </button>
                        )}
                        {canAccept && (
                          <button
                            type="button"
                            style={ProfileStyle.miniBtnPrimary}
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              setError('');
                              try {
                                const next = await api.acceptDuel(d.id);
                                onOpenDuel?.(next?.id || d.id);
                                await loadDuels();
                              } catch (err) {
                                if (isUnauthorized(err)) return onRequireAuth?.();
                                setError(getApiErrorMessage(err));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            {STRINGS.PROFILE.duels.buttons.accept}
                          </button>
                        )}
                        {canDecline && (
                          <button
                            type="button"
                            style={ProfileStyle.miniBtnDanger}
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              setError('');
                              try {
                                await api.declineDuel(d.id);
                                await loadDuels();
                              } catch (err) {
                                if (isUnauthorized(err)) return onRequireAuth?.();
                                setError(getApiErrorMessage(err));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            {STRINGS.PROFILE.duels.buttons.decline}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            style={ProfileStyle.miniBtnDanger}
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              setError('');
                              try {
                                await api.cancelDuel(d.id);
                                await loadDuels();
                              } catch (err) {
                                if (isUnauthorized(err)) return onRequireAuth?.();
                                setError(getApiErrorMessage(err));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            {STRINGS.PROFILE.duels.buttons.cancel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!busy && (duels || []).length === 0 && (
                <div style={ProfileStyle.meta}>{STRINGS.PROFILE.duels.empty}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

