import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ProfileStyle from '@/Styles/ComponentStyles/ProfileStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import ProfileLockedCard from '@/features/Profile/components/ProfileLockedCard';
import { useProfileState } from '@/features/Profile/hooks/useProfileState';
import type { ProfileProps } from '@/features/Profile/types';

export default function ProfilePage({
  user,
  friendUserId,
  onRequireAuth,
  onNavigateHome,
  onOpenQuiz,
  onOpenDuel,
  onBack,
}: ProfileProps) {
  const {
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
  } = useProfileState({ user, friendUserId, onRequireAuth, onOpenDuel });

  if (!user) {
    return <ProfileLockedCard onRequireAuth={onRequireAuth} onNavigateHome={onNavigateHome} />;
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
                {ICONS.common.openBook} {STRINGS.PROFILE.pills.story} {story.completed_levels ?? 0}/
                {story.total_levels ?? 0}
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
                      {STRINGS.COMMON.separators.dot} {ICONS.common.trophy} {d?.challenger_points ?? 0}:
                      {d?.opponent_points ?? 0}
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
