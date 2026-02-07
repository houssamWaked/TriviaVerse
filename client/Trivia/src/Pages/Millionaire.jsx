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

export default function Millionaire({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ladders, setLadders] = useState([]);
  const [ladderId, setLadderId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getMillionaireConfig()
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.ladders) ? data.ladders : [];
        setLadders(rows);
        if (!ladderId && rows[0]?.id) setLadderId(rows[0].id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLadder = useMemo(
    () => ladders.find((l) => l.id === ladderId) || null,
    [ladders, ladderId]
  );

  const start = async () => {
    if (!user) return onRequireAuth?.('millionaire');
    setBusy(true);
    setError('');
    try {
      const res = await api.startMillionaireSession(
        ladderId ? { ladder_id: ladderId } : {}
      );
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
              background: colors.accent.yellow,
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 44px rgba(216, 46, 46, 0.18)',
              color: colors.neutral.white,
              fontSize: 34,
              fontWeight: 950,
            }}
            aria-label="Crown"
          >
            ♛
          </div>
          <h1 style={ModeStartStyle.title}>Millionaire Mode</h1>
          <p style={ModeStartStyle.subtitle}>
            Answer 15 questions to win €1,000,000.
          </p>
        </div>

        <div className="tv-card" style={ModeStartStyle.card}>
          <div
            style={{ ...ModeStartStyle.row, justifyContent: 'space-between' }}
          >
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ModeStartStyle.btn}
              onClick={onNavigateHome}
            >
              Back to Home
            </button>
            <span style={ModeStartStyle.pill}>Lifelines enabled</span>
          </div>

          {!!error && <div style={ModeStartStyle.error}>{error}</div>}

          <div
            className="tv-card"
            style={{
              ...ModeStartStyle.section,
              maxWidth: 720,
              margin: '18px auto 0',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.14) 100%)',
              border: '1px solid rgba(255,255,255,0.32)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3
              style={{
                ...ModeStartStyle.sectionTitle,
                textAlign: 'center',
                color: colors.neutral.white,
              }}
            >
              Rules
            </h3>

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {[
                'Answer 15 multiple choice questions',
                'Use three lifelines: 50:50, Phone a Friend, Ask the Audience',
                'One wrong answer ends the game',
                'Walk away at any time with your current winnings',
              ].map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    fontSize: 14,
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.94)',
                    lineHeight: 1.55,
                    textShadow: '0 10px 26px rgba(0,0,0,0.14)',
                  }}
                >
                  <span style={{ color: colors.accent.green, fontWeight: 950 }}>
                    ✓
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {ladders.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={{
                    ...ModeStartStyle.btn,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: colors.neutral.white,
                  }}
                  onClick={() => setShowAdvanced((v) => !v)}
                  disabled={busy}
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced ladder
                </button>

                {showAdvanced && (
                  <div style={ModeStartStyle.field}>
                    <span
                      style={{
                        ...ModeStartStyle.label,
                        color: 'rgba(255,255,255,0.92)',
                      }}
                    >
                      Ladder config
                    </span>
                    <select
                      style={{
                        ...ModeStartStyle.select,
                        background: 'rgba(255,255,255,0.92)',
                        color: colors.neutral[900],
                        border: '1px solid rgba(255,255,255,0.32)',
                      }}
                      value={ladderId}
                      onChange={(e) => setLadderId(e.target.value)}
                      disabled={busy}
                    >
                      {ladders.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 850,
                        color: 'rgba(255,255,255,0.82)',
                      }}
                    >
                      Current: {selectedLadder?.name || 'Default'}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
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
                minWidth: 180,
                border: 'none',
                background: colors.accent.yellow,
                color: colors.neutral.white,
                boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
              }}
              onClick={start}
              disabled={busy || !user}
            >
              Start Game
            </button>

            {!user ? (
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
                onClick={() => onRequireAuth?.('millionaire')}
                disabled={busy}
              >
                Join / Login
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
