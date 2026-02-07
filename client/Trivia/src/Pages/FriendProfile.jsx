import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import FriendProfileStyle from '@/Styles/ComponentStyles/FriendProfileStyle';
import { getApiErrorMessage } from '@/utils/apiError';

function formatDate(d) {
  if (!d) return STRINGS.COMMON.separators.emDash;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return STRINGS.COMMON.separators.emDash;
  return t.toLocaleDateString();
}

function initials(username) {
  const u = String(username || '').trim();
  if (!u) return STRINGS.FRIEND_PROFILE.initialsFallback;
  return u.slice(0, 1).toUpperCase();
}

export default function FriendProfile({
  user,
  friendUserId,
  onRequireAuth,
  onBack,
  onOpenQuiz,
  onNavigateHome,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const name = useMemo(
    () => data?.user?.username || STRINGS.FRIEND_PROFILE.nameFallback,
    [data?.user?.username]
  );
  const avatarUrl = data?.user?.avatar_url || '';

  const load = async () => {
    if (!friendUserId) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.getFriendStats(friendUserId);
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user, friendUserId]);

  if (!user) {
    return (
      <div style={FriendProfileStyle.page}>
        <div style={FriendProfileStyle.container}>
          <div className="tv-card" style={FriendProfileStyle.lockCard}>
            <h2 style={FriendProfileStyle.lockTitle}>
              {STRINGS.FRIEND_PROFILE.locked.title}
            </h2>
            <p style={FriendProfileStyle.lockText}>
              {STRINGS.FRIEND_PROFILE.locked.subtitle}
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendProfileStyle.primaryBtnMain}
              onClick={() => onRequireAuth?.('friend')}
            >
              {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendProfileStyle.secondaryBtnWhite}
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
    <div style={FriendProfileStyle.page}>
      <div style={FriendProfileStyle.container}>
        <div style={FriendProfileStyle.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={FriendProfileStyle.btnWhite}
            onClick={onBack}
            disabled={busy}
          >
            {STRINGS.COMMON.symbols.leftArrow} {STRINGS.FRIEND_PROFILE.buttons.backToFriends}
          </button>

          <div style={FriendProfileStyle.topActions}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendProfileStyle.btnWhite}
              onClick={load}
              disabled={busy}
            >
              {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={FriendProfileStyle.btnPrimary}
              onClick={onNavigateHome}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>
        </div>

        {!!error && <div style={FriendProfileStyle.errorCard}>{error}</div>}

        <div className="tv-card" style={FriendProfileStyle.headerCard}>
          <div style={FriendProfileStyle.headerTop}>
            <div style={FriendProfileStyle.avatar} aria-label={STRINGS.FRIEND_PROFILE.aria.avatar}>
              {avatarUrl ? (
                <img alt={name} src={avatarUrl} style={FriendProfileStyle.avatarImg} />
              ) : (
                initials(name)
              )}
            </div>
            <div style={FriendProfileStyle.nameWrap}>
              <h1 style={FriendProfileStyle.name}>
                {name} <span style={FriendProfileStyle.handshakeIcon}>{ICONS.common.handshake}</span>
              </h1>
              <div style={FriendProfileStyle.sub}>
                {busy ? STRINGS.FRIEND_PROFILE.header.loading : STRINGS.FRIEND_PROFILE.header.title}
              </div>
            </div>
          </div>

          <div style={FriendProfileStyle.pills}>
            <div style={FriendProfileStyle.pill}>
              {ICONS.common.star} {STRINGS.FRIEND_PROFILE.pills.level}{' '}
              {data?.user_stats?.level ?? 1}
            </div>
            <div style={FriendProfileStyle.pill}>
              {ICONS.common.brain} {STRINGS.FRIEND_PROFILE.pills.xp}{' '}
              {data?.user_stats?.xp_total ?? 0}
            </div>
            <div style={FriendProfileStyle.pill}>
              {ICONS.common.fire} {STRINGS.FRIEND_PROFILE.pills.streak}{' '}
              {data?.user_stats?.streak_days ?? 0}
              {STRINGS.FRIEND_PROFILE.pills.streakSuffix}
            </div>
          </div>
        </div>

        <div className="tv-card" style={FriendProfileStyle.sectionCard}>
          <h2 style={FriendProfileStyle.sectionTitle}>
            {STRINGS.FRIEND_PROFILE.section.bestScoresTitle}
          </h2>
          <div style={FriendProfileStyle.sectionSub}>
            {STRINGS.FRIEND_PROFILE.section.bestScoresSubtitle}
          </div>

          <div style={FriendProfileStyle.list}>
            {(data?.custom_quiz_best || []).map((e) => (
              <button
                key={e.quiz_id}
                type="button"
                className="tv-card tv-card--hover"
                style={FriendProfileStyle.item}
                onClick={() => onOpenQuiz?.(e.quiz_id)}
                disabled={busy || !onOpenQuiz}
              >
                <div style={FriendProfileStyle.itemTop}>
                  <div style={FriendProfileStyle.itemTitle}>{e.title}</div>
                  <div style={FriendProfileStyle.scorePill}>
                    {ICONS.common.trophy} {e.best_score}
                  </div>
                </div>
                <div style={FriendProfileStyle.meta}>
                  {STRINGS.FRIEND_PROFILE.section.updatedPrefix} {formatDate(e.updated_at)}
                </div>
              </button>
            ))}

            {!busy && (data?.custom_quiz_best || []).length === 0 && (
              <div style={FriendProfileStyle.meta}>{STRINGS.FRIEND_PROFILE.section.noneScores}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
