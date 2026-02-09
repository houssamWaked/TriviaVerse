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
        <div className="tv-card" style={BlitzStyle.stageCard}>
          {!!error && <div style={BlitzStyle.errorInline}>{error}</div>}

          {/* TOP SETUP PANEL */}
          <div className="tv-card" style={BlitzStyle.setupPanel}>
            <div style={BlitzStyle.setupGrid}>
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

                <div style={BlitzStyle.diffPillsRow}>
                  {diffButtons.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={BlitzStyle.diffPill(difficulty === d.key)}
                      onClick={() => setDifficulty(d.key)}
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
          <div style={BlitzStyle.featureGrid}>
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
          <div style={BlitzStyle.ctaRow}>
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
              style={BlitzStyle.secondaryBtn}
              onClick={onNavigateHome}
              disabled={busy}
            >
              {STRINGS.COMMON.backHome}
            </button>

            {!user ? (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={BlitzStyle.ghostBtn}
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
  );
}
