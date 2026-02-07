import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ProfileStyle from '@/Styles/ComponentStyles/ProfileStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

function formatDate(d) {
  if (!d) return STRINGS.COMMON.separators.emDash;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return STRINGS.COMMON.separators.emDash;
  return t.toLocaleDateString();
}

function initials(username) {
  const u = String(username || '').trim();
  if (!u) return STRINGS.PROFILE.initialsFallback;
  return u.slice(0, 1).toUpperCase();
}

function modeLabel(mode) {
  if (mode === 'story') return STRINGS.PROFILE.modes.story;
  if (mode === 'classic') return STRINGS.PROFILE.modes.classic;
  if (mode === 'blitz') return STRINGS.PROFILE.modes.blitz;
  if (mode === 'millionaire') return STRINGS.PROFILE.modes.millionaire;
  if (mode === 'custom') return STRINGS.PROFILE.modes.custom;
  return mode;
}

function modeIcon(mode) {
  if (mode === 'story') return ICONS.common.openBook;
  if (mode === 'classic') return ICONS.common.bookmark;
  if (mode === 'blitz') return ICONS.common.bolt;
  if (mode === 'millionaire') return ICONS.common.crownGold;
  if (mode === 'custom') return ICONS.common.gamepad;
  return ICONS.common.user;
}

export default function Profile({ user, onRequireAuth, onNavigateHome, onOpenQuiz }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.getMyProfile();
      setData(res);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('profile');
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
  }, [!!user]);

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
      const s = modeSummary?.[m] || {};
      return {
        mode: m,
        label: modeLabel(m),
        icon: modeIcon(m),
        played: s.played ?? 0,
        completed: s.completed ?? 0,
        best: s.best_score ?? 0,
        last: s.last_played_at ?? null,
      };
    });
  }, [modeSummary]);

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
              onClick={() => onRequireAuth?.('profile')}
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
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={ProfileStyle.btnWhite}
            onClick={load}
            disabled={busy}
          >
            {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
          </button>
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
                {!!email && (
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
      </div>
    </div>
  );
}

