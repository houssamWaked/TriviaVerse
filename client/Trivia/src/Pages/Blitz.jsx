import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import ModeStartStyle from '../Styles/ComponentStyles/ModeStartStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function Blitz({ user, onRequireAuth, onNavigateHome, onPlaySession }) {
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

  const diffMeta = useMemo(() => {
    if (difficulty === 'easy') return { label: 'Easy', range: '1–4' };
    if (difficulty === 'medium') return { label: 'Medium', range: '4–7' };
    return { label: 'Hard', range: '8–10' };
  }, [difficulty]);

  const start = async () => {
    if (!user) return onRequireAuth?.('blitz');
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
            style={{
              width: 74,
              height: 74,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.26)',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
              color: colors.neutral.white,
              fontSize: 30,
              fontWeight: 950,
              backdropFilter: 'blur(10px)',
            }}
            aria-label="Lightning"
          >
            ⚡
          </div>
          <h1 style={ModeStartStyle.title}>60-Second Blitz</h1>
          <p style={ModeStartStyle.subtitle}>
            Answer as many questions as you can in {config?.time_limit_sec ?? 60} seconds!
          </p>
        </div>

        <div className="tv-card" style={ModeStartStyle.card}>
          <div style={{ textAlign: 'center' }}>
            {!!error && <div style={ModeStartStyle.error}>{error}</div>}

            <div
              className="tv-card"
              style={{
                ...ModeStartStyle.section,
                maxWidth: 720,
                margin: '18px auto 0',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)',
                border: '1px solid rgba(255,255,255,0.30)',
                boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <h3
                style={{
                  ...ModeStartStyle.sectionTitle,
                  textAlign: 'center',
                  color: colors.neutral.white,
                }}
              >
                How to Play
              </h3>

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  color: 'rgba(255,255,255,0.94)',
                  fontWeight: 850,
                  lineHeight: 1.55,
                }}
              >
                {[
                  `You have ${config?.time_limit_sec ?? 60} seconds on the clock`,
                  'Answer rapid-fire questions as fast as possible',
                  'Each correct answer adds to your score',
                  "Wrong answers don't penalize, just keep going!",
                  'Speed and accuracy both matter',
                ].map((t) => (
                  <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: colors.accent.yellow, fontWeight: 950 }}>○</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 950, color: 'rgba(255,255,255,0.92)' }}>
                  Difficulty
                </div>
                <div style={{ ...ModeStartStyle.row, justifyContent: 'center', marginTop: 10 }}>
                  {[
                    { key: 'easy', label: 'Easy', range: '1–4' },
                    { key: 'medium', label: 'Medium', range: '4–7' },
                    { key: 'hard', label: 'Hard', range: '8–10' },
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={{
                        ...ModeStartStyle.btn,
                        background:
                          difficulty === d.key ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: colors.neutral.white,
                        minWidth: 160,
                      }}
                      onClick={() => setDifficulty(d.key)}
                      disabled={busy}
                    >
                      {d.label} ({d.range})
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    fontWeight: 850,
                    color: 'rgba(255,255,255,0.86)',
                  }}
                >
                  Selected: {diffMeta.label} (question level {diffMeta.range})
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                maxWidth: 820,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {[
                { title: `${config?.time_limit_sec ?? 60}s`, sub: 'Time Limit', icon: '⏱' },
                { title: 'Fast', sub: 'Paced', icon: '⚡' },
                { title: '15+', sub: 'Questions', icon: '✅' },
              ].map((s) => (
                <div
                  key={s.sub}
                  className="tv-card"
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    boxShadow: '0 18px 44px rgba(0,0,0,0.16)',
                    backdropFilter: 'blur(12px)',
                    color: colors.neutral.white,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 950, opacity: 0.95 }}>{s.icon}</div>
                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 950 }}>{s.title}</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, opacity: 0.9 }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{
                  ...ModeStartStyle.btn,
                  height: 54,
                  minWidth: 200,
                  border: 'none',
                  background: colors.accent.red,
                  color: colors.neutral.white,
                  boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
                }}
                onClick={start}
                disabled={busy || !user}
              >
                ⚡ Start Blitz
              </button>

              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{
                  ...ModeStartStyle.btn,
                  height: 54,
                  minWidth: 180,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: colors.neutral.white,
                }}
                onClick={onNavigateHome}
                disabled={busy}
              >
                Back to Home
              </button>

              {!user ? (
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={{
                    ...ModeStartStyle.btn,
                    height: 54,
                    minWidth: 180,
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: colors.neutral.white,
                  }}
                  onClick={() => onRequireAuth?.('blitz')}
                  disabled={busy}
                >
                  Join / Login
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

