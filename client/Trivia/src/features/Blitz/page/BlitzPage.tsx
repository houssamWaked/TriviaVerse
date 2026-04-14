import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import ModeStartStyle from '@/Styles/ComponentStyles/ModeStartStyle';
import BlitzStyle from '@/Styles/ComponentStyles/BlitzStyle';
import BlitzFeatureCards from '../components/BlitzFeatureCards';
import { useBlitzPageState } from '../hooks/useBlitzPageState';
import type { BlitzDifficulty, BlitzProps } from '../types';

/**
 * Blitz mode start page: choose difficulty, start a timed session, or challenge a friend.
 * @param user Current user snapshot (enables duel flow and auth gating).
 * @param onPlaySession Callback invoked with a started session id.
 * @returns React element.
 */
export default function BlitzPage({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
  onOpenDuel,
}: BlitzProps) {
  const {
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
  } = useBlitzPageState({
    user,
    onRequireAuth,
    onOpenDuel,
    onPlaySession,
  });

  return (
    <div style={ModeStartStyle.page}>
      <div style={ModeStartStyle.container}>
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

        <div className="tv-card tv-blitz-stage" style={BlitzStyle.stageCard}>
          {!!error && <div style={BlitzStyle.errorInline}>{error}</div>}

          <div className="tv-card tv-blitz-setup" style={BlitzStyle.setupPanel}>
            <div className="tv-blitz-setup-grid" style={BlitzStyle.setupGrid}>
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

          <BlitzFeatureCards seconds={seconds} />

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
                  onClick={closeDuel}
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
                  onClick={sendDuel}
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
