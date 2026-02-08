import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ModeStartStyle from '@/Styles/ComponentStyles/ModeStartStyle';
import BlitzStyle from '@/Styles/ComponentStyles/BlitzStyle';
import { getApiErrorMessage } from '@/utils/apiError';

export default function Blitz({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');

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

  const seconds = config?.time_limit_sec ?? 60;

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
          <p style={ModeStartStyle.subtitle}>{STRINGS.BLITZ.subtitle(seconds)}</p>
        </div>

        <div className="tv-card" style={ModeStartStyle.card}>
          <div style={BlitzStyle.center}>
            {!!error && <div style={ModeStartStyle.error}>{error}</div>}

            <div
              className="tv-card"
              style={BlitzStyle.howToCard}
            >
              <h3 style={BlitzStyle.howToTitle}>
                {STRINGS.BLITZ.howToPlayTitle}
              </h3>

              <div style={BlitzStyle.howToList}>
                {[
                  STRINGS.BLITZ.howToPlay.onClock(seconds),
                  STRINGS.BLITZ.howToPlay.rapidFire,
                  STRINGS.BLITZ.howToPlay.correctAdds,
                  STRINGS.BLITZ.howToPlay.wrongNoPenalty,
                  STRINGS.BLITZ.howToPlay.speedAccuracy,
                ].map((t) => (
                  <div key={t} style={BlitzStyle.howToRow}>
                    <span style={BlitzStyle.howToBullet}>
                      {ICONS.common.circle}
                    </span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div style={BlitzStyle.difficultyBlock}>
                <div style={BlitzStyle.difficultyTitle}>
                  {STRINGS.BLITZ.difficultyTitle}
                </div>
                <div
                  style={BlitzStyle.difficultyRow}
                >
                  {[
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
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={BlitzStyle.difficultyBtn(difficulty === d.key)}
                      onClick={() => setDifficulty(d.key)}
                      disabled={busy}
                    >
                      {d.label} ({d.range})
                    </button>
                  ))}
                </div>

                <div style={BlitzStyle.difficultySelected}>
                  {STRINGS.BLITZ.difficulty.selected(diffMeta.label, diffMeta.range)}
                </div>
              </div>
            </div>

            <div
              style={BlitzStyle.statsGrid}
            >
              {[
                {
                  title: STRINGS.BLITZ.formatSeconds(seconds),
                  sub: STRINGS.BLITZ.stats.timeLimit,
                  icon: ICONS.common.timer,
                },
                {
                  title: STRINGS.BLITZ.stats.fast,
                  sub: STRINGS.BLITZ.stats.paced,
                  icon: ICONS.common.bolt,
                },
                {
                  title: STRINGS.BLITZ.stats.questionsCount,
                  sub: STRINGS.BLITZ.stats.questions,
                  icon: ICONS.common.check,
                },
              ].map((s) => (
                <div key={s.sub} className="tv-card" style={BlitzStyle.statCard}>
                  <div style={BlitzStyle.statIcon}>{s.icon}</div>
                  <div style={BlitzStyle.statValue}>{s.title}</div>
                  <div style={BlitzStyle.statLabel}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div
              style={BlitzStyle.actions}
            >
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={BlitzStyle.startBtn}
                onClick={start}
                disabled={busy}
              >
                {ICONS.common.bolt} {STRINGS.BLITZ.buttons.start}
              </button>

              <button
                type="button"
                className="tv-card tv-card--hover"
                style={BlitzStyle.homeBtn}
                onClick={onNavigateHome}
                disabled={busy}
              >
                {STRINGS.COMMON.backHome}
              </button>

              {!user ? (
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={BlitzStyle.loginBtn}
                  onClick={() => onRequireAuth?.('blitz')}
                  disabled={busy}
                >
                  Login to save progress
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
