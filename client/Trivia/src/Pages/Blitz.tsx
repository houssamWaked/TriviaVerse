import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ModeStartStyle from '@/Styles/ComponentStyles/ModeStartStyle';
import BlitzStyle from '@/Styles/ComponentStyles/BlitzStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';

type AppUser = {
  id?: string;
  username?: string;
} | null;

type BlitzDifficulty = 'easy' | 'medium' | 'hard';

type BlitzConfig = {
  time_limit_sec?: number | null;
};

type DuelFriend = {
  id: string;
  username?: string | null;
};

type BlitzProps = {
  user?: AppUser;
  onRequireAuth?: (mode?: string) => void;
  onNavigateHome?: () => void;
  onPlaySession?: (sessionId?: string) => void;
  onOpenDuel?: (duelId?: string) => void;
};

/**
 * Blitz mode start page: choose difficulty, start a timed session, or challenge a friend.
 * @param user Current user snapshot (enables duel flow and auth gating).
 * @param onPlaySession Callback invoked with a started session id.
 * @returns React element.
 */
export default function Blitz({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
  onOpenDuel,
}: BlitzProps) {
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
    if (difficulty === 'easy')
      return {
        label: STRINGS.BLITZ.difficulty.easy,
        range: STRINGS.BLITZ.difficulty.range.easy,
      };
    if (difficulty === 'medium')
      return {
        label: STRINGS.BLITZ.difficulty.medium,
        range: STRINGS.BLITZ.difficulty.range.medium,
      };
    return {
      label: STRINGS.BLITZ.difficulty.hard,
      range: STRINGS.BLITZ.difficulty.range.hard,
    };
  }, [difficulty]);

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

  return (
    <div style={ModeStartStyle.page}>
      <div style={ModeStartStyle.container}>
        {/* HERO */}
        <div style={ModeStartStyle.hero}>
          <div
            style={BlitzStyle.heroIcon}
            aria-label={STRINGS.BLITZ.aria.lightning}
          >
            {ICONS.common.bolt}
          </div>
          <h1 style={ModeStartStyle.title}>{STRINGS.BLITZ.title}</h1>
          <p style={ModeStartStyle.subtitle}>
            {STRINGS.BLITZ.subtitle(seconds)}
          </p>
        </div>

        {/* STAGE */}
        <div className="tv-card tv-blitz-stage" style={BlitzStyle.stageCard}>
          {!!error && <div style={BlitzStyle.errorInline}>{error}</div>}

          {/* TOP SETUP PANEL */}
          <div className="tv-card tv-blitz-setup" style={BlitzStyle.setupPanel}>
            <div className="tv-blitz-setup-grid" style={BlitzStyle.setupGrid}>
              {/* HOW TO */}
              <div style={BlitzStyle.howToCol}>
                <div style={BlitzStyle.panelTitle}>
                  {STRINGS.BLITZ.howToPlayTitle}
                </div>

                <div style={BlitzStyle.howToList}>
                  {[
                    STRINGS.BLITZ.howToPlay.onClock(seconds),
                    STRINGS.BLITZ.howToPlay.rapidFire,
                    STRINGS.BLITZ.howToPlay.correctAdds,
                    STRINGS.BLITZ.howToPlay.wrongNoPenalty,
                    STRINGS.BLITZ.howToPlay.speedAccuracy,
                  ].map((t) => (
                    <div key={t} style={BlitzStyle.howToRow}>
                      <span style={BlitzStyle.bulletDot} />
                      <span style={BlitzStyle.howToText}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DIFFICULTY */}
              <div style={BlitzStyle.diffCol}>
                <div style={BlitzStyle.panelTitle}>
                  {STRINGS.BLITZ.difficultyTitle}
                </div>

                <div
                  className="tv-blitz-diff-pills"
                  style={BlitzStyle.diffPillsRow}
                >
                  {diffButtons.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={BlitzStyle.diffPill(difficulty === d.key)}
                      onClick={() => setDifficulty(d.key as BlitzDifficulty)}
                      disabled={busy}
                    >
                      {d.label} ({d.range})
                    </button>
                  ))}
                </div>

                <div style={BlitzStyle.diffHint}>
                  {STRINGS.BLITZ.difficulty.selected(
                    diffMeta.label,
                    diffMeta.range
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE CARDS */}
          <div className="tv-blitz-feature-grid" style={BlitzStyle.featureGrid}>
            {[
              {
                icon: ICONS.common.timer,
                title: STRINGS.BLITZ.formatSeconds(seconds),
                sub: STRINGS.BLITZ.stats.timeLimit,
              },
              {
                icon: ICONS.common.bolt,
                title: STRINGS.BLITZ.stats.fast,
                sub: STRINGS.BLITZ.stats.paced,
              },
              {
                icon: ICONS.common.check,
                title: STRINGS.BLITZ.stats.questionsCount,
                sub: STRINGS.BLITZ.stats.questions,
              },
            ].map((s) => (
              <div
                key={s.sub}
                className="tv-card"
                style={BlitzStyle.featureCard}
              >
                <div style={BlitzStyle.featureIcon}>{s.icon}</div>
                <div style={BlitzStyle.featureValue}>{s.title}</div>
                <div style={BlitzStyle.featureLabel}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* CTA ROW */}
          <div className="tv-blitz-cta" style={BlitzStyle.ctaRow}>
            <button
              type="button"
              className="tv-card tv-card--hover tv-blitz-btn tv-blitz-btn--primary"
              style={BlitzStyle.startBtn}
              onClick={start}
              disabled={busy}
            >
              {ICONS.common.bolt} {STRINGS.BLITZ.buttons.start}
            </button>

            <button
              type="button"
              className="tv-card tv-card--hover tv-blitz-btn tv-blitz-btn--secondary"
              style={BlitzStyle.secondaryBtn}
              onClick={toggleDuel}
              disabled={busy || !onOpenDuel}
            >
              {ICONS.common.bolt} {STRINGS.BLITZ.buttons.duel}
            </button>

            <button
              type="button"
              className="tv-card tv-card--hover tv-blitz-btn tv-blitz-btn--secondary"
              style={BlitzStyle.secondaryBtn}
              onClick={onNavigateHome}
              disabled={busy}
            >
              {STRINGS.COMMON.backHome}
            </button>

            {!user ? (
              <button
                type="button"
                className="tv-card tv-card--hover tv-blitz-btn tv-blitz-btn--ghost"
                style={BlitzStyle.ghostBtn}
                onClick={() => onRequireAuth?.('blitz')}
                disabled={busy}
              >
                Login to save progress
              </button>
            ) : null}
          </div>

          {duelOpen && (
            <div className="tv-card" style={BlitzStyle.duelCard}>
              <div style={BlitzStyle.duelTop}>
                <div>
                  <div style={BlitzStyle.duelTitle}>{STRINGS.BLITZ.duel.title}</div>
                  <div style={BlitzStyle.duelSub}>{STRINGS.BLITZ.duel.subtitle}</div>
                </div>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={BlitzStyle.secondaryBtn}
                  onClick={() => {
                    setDuelOpen(false);
                    setDuelFriendId('');
                  }}
                  disabled={busy}
                >
                  {STRINGS.COMMON.buttons.close}
                </button>
              </div>

              <div className="tv-blitz-duel-row" style={BlitzStyle.duelRow}>
                <select
                  className="tv-blitz-duel-select"
                  style={BlitzStyle.duelSelect}
                  value={duelFriendId}
                  onChange={(e) => setDuelFriendId(e.target.value)}
                  disabled={busy}
                >
                  <option value="">{STRINGS.BLITZ.duel.friendPlaceholder}</option>
                  {duelFriends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.username || STRINGS.COMMON.playerFallback}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="tv-card tv-card--hover tv-blitz-duel-send"
                  style={BlitzStyle.duelSendBtn}
                  disabled={busy || !duelFriendId || !onOpenDuel}
                  onClick={async () => {
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
                  }}
                >
                  {STRINGS.BLITZ.duel.send}
                </button>
              </div>

              {duelFriends.length === 0 && !busy && (
                <div style={BlitzStyle.duelSub}>{STRINGS.BLITZ.duel.noFriends}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

