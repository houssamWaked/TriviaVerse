import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function pickAccent(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}deg 92% 55%)`;
}

export default function Classic({ user, onRequireAuth, onNavigateHome, onPlaySession }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});

  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [questionsCount, setQuestionsCount] = useState(10);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listCategories(), api.getHomeMetrics()])
      .then(([cats, m]) => {
        if (cancelled) return;
        const rows = Array.isArray(cats) ? cats : [];
        setCategories(rows);
        setMetrics(m || null);
        if (!categoryId && rows[0]?.id) setCategoryId(rows[0].id);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!categories.length) return () => {};

    Promise.all(
      categories.map(async (c) => {
        try {
          const s = await api.getCategoryStats(c.id);
          return [c.id, Number(s?.questions_available)];
        } catch {
          return [c.id, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next = {};
      for (const [id, count] of entries) {
        if (!id) continue;
        if (Number.isFinite(count)) next[id] = count;
      }
      setCategoryCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, [categories]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const startWithCategory = async (id) => {
    if (!user) return onRequireAuth?.('classic');
    const cid = String(id || '').trim();
    if (!cid) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.startClassicSession({
        category_id: cid,
        difficulty,
        questions_count: clampInt(questionsCount, 1, 50),
      });
      onPlaySession?.(res.session_id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const glassCard = {
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.20)',
    boxShadow: '0 22px 70px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(12px)',
    borderRadius: 22,
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 72px)',
        background: colors.gradients.main,
        padding: '28px 18px 60px',
      }}
    >
      <button
        type="button"
        className="tv-card tv-card--hover"
        onClick={onNavigateHome}
        disabled={busy}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 52,
          height: 52,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(0,0,0,0.44)',
          color: colors.neutral.white,
          fontSize: 22,
          fontWeight: 950,
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
        }}
      >
        ×
      </button>

      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', paddingTop: 22 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 950,
              boxShadow: '0 14px 34px rgba(0,0,0,0.16)',
            }}
          >
            <span style={{ fontSize: 16 }}>🏆</span>
            <span style={{ fontSize: 13, letterSpacing: 0.2 }}>Classic Mode</span>
          </div>

          <h1
            style={{
              margin: '18px 0 0',
              fontSize: 56,
              fontWeight: 950,
              letterSpacing: -0.9,
              color: colors.neutral.white,
              textShadow: '0 18px 50px rgba(0,0,0,0.20)',
            }}
          >
            Choose Your Category
          </h1>
          <p
            style={{
              margin: '10px auto 0',
              maxWidth: 760,
              fontSize: 14,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.7,
              textShadow: '0 10px 26px rgba(0,0,0,0.14)',
            }}
          >
            Select a category and test your knowledge across various topics. Each category has
            hundreds of questions.
          </p>
        </div>

        {!!error && (
          <div
            className="tv-card"
            style={{
              ...glassCard,
              margin: '18px auto 0',
              padding: 12,
              maxWidth: 820,
              color: colors.neutral.white,
            }}
          >
            <div style={{ fontWeight: 900 }}>{error}</div>
          </div>
        )}

        <div
          style={{
            marginTop: 26,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {categories.length === 0
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="tv-card"
                  style={{
                    ...glassCard,
                    padding: 18,
                    minHeight: 120,
                    opacity: 0.75,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.22)',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 12,
                      height: 16,
                      width: '60%',
                      background: 'rgba(255,255,255,0.18)',
                      borderRadius: 999,
                    }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      height: 12,
                      width: '46%',
                      background: 'rgba(255,255,255,0.14)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              ))
             : categories.map((c) => {
                 const isSelected = c.id === categoryId;
                 const accent = pickAccent(c.id || c.name);
                 const count = categoryCounts[c.id] ?? null;
                 return (
                   <button
                     key={c.id}
                     type="button"
                    className="tv-card tv-card--hover"
                    onClick={() => {
                      setCategoryId(c.id);
                      startWithCategory(c.id);
                    }}
                    disabled={busy}
                    style={{
                      ...glassCard,
                      padding: 18,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected
                        ? '2px solid rgba(255,255,255,0.38)'
                        : glassCard.border,
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: accent,
                        color: colors.neutral.white,
                        fontSize: 22,
                        fontWeight: 950,
                        boxShadow: '0 16px 44px rgba(0,0,0,0.18)',
                      }}
                      aria-hidden="true"
                    >
                      {c.icon || '❖'}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 950,
                          color: colors.neutral.white,
                          letterSpacing: -0.2,
                          textShadow: '0 12px 32px rgba(0,0,0,0.16)',
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight: 850,
                          color: 'rgba(255,255,255,0.82)',
                        }}
                      >
                        {count != null ? `${count} questions available` : 'Questions available'}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>

        <div
          style={{
            marginTop: 26,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { value: String(categories.length || 0), label: 'Categories' },
            {
              value: metrics?.questions != null ? `${metrics.questions}+` : '—',
              label: 'Total Questions',
            },
            { value: '∞', label: 'Endless Fun' },
          ].map((s) => (
            <div
              key={s.label}
              className="tv-card"
              style={{ ...glassCard, padding: 18, textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 950,
                  color: colors.neutral.white,
                  textShadow: '0 18px 44px rgba(0,0,0,0.18)',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 850,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <details
            className="tv-card"
            style={{
              ...glassCard,
              padding: 14,
              maxWidth: 820,
              width: '100%',
              color: colors.neutral.white,
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 950 }}>
              Advanced settings
            </summary>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="tv-card tv-card--hover"
                    disabled={busy}
                    onClick={() => setDifficulty(d)}
                    style={{
                      height: 44,
                      padding: '0 14px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.22)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 950,
                      background:
                        difficulty === d ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
                      color: colors.neutral.white,
                    }}
                  >
                    {d}
                  </button>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 900, color: 'rgba(255,255,255,0.88)' }}>
                    Questions
                  </span>
                  <input
                    style={{
                      height: 44,
                      width: 110,
                      padding: '0 12px',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.22)',
                      outline: 'none',
                      fontSize: 14,
                      fontWeight: 950,
                      color: colors.neutral.white,
                      background: 'rgba(0,0,0,0.18)',
                    }}
                    type="number"
                    min={1}
                    max={50}
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 850,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.6,
                }}
              >
                Current: {selectedCategory ? selectedCategory.name : '—'} • {difficulty} •{' '}
                {clampInt(questionsCount, 1, 50)} questions
              </div>
            </div>
          </details>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(255,255,255,0.82)' }}>
            {user
              ? `Logged in as ${user.username}. Tap a category to start.`
              : 'Login required to start. Tap any category to login.'}
          </div>
        </div>
      </div>
    </div>
  );
}
