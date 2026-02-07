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
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState(null);

  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.listCategories(), api.getBlitzConfig()])
      .then((res) => {
        if (cancelled) return;
        const cats = res[0].status === 'fulfilled' ? res[0].value : [];
        setCategories(Array.isArray(cats) ? cats : []);
        if (!categoryId && Array.isArray(cats) && cats[0]?.id) setCategoryId(cats[0].id);

        const cfg = res[1].status === 'fulfilled' ? res[1].value : null;
        if (cfg) setConfig(cfg);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const start = async () => {
    if (!user) return onRequireAuth?.('blitz');
    if (!categoryId) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.startBlitzSession({
        category_id: categoryId,
        difficulty,
      });
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
          <div style={ModeStartStyle.badge}>
            <span style={ModeStartStyle.badgeIcon}>⚡</span>
            <span style={ModeStartStyle.badgeText}>Blitz</span>
            <span style={ModeStartStyle.badgeDot}>✨</span>
          </div>
          <h1 style={ModeStartStyle.title}>60s Blitz</h1>
          <p style={ModeStartStyle.subtitle}>
            One minute. No submit button. Tap answers fast and stack points.
          </p>
        </div>

        <div className="tv-card" style={ModeStartStyle.card}>
          <div style={{ ...ModeStartStyle.row, justifyContent: 'space-between' }}>
            <div style={ModeStartStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={ModeStartStyle.btn}
                onClick={onNavigateHome}
              >
                Home
              </button>
            </div>
            {config?.time_limit_sec ? (
              <span style={ModeStartStyle.pill}>⏱ {config.time_limit_sec}s total</span>
            ) : (
              <span style={ModeStartStyle.pill}>⏱ 60s total</span>
            )}
          </div>

          {!!error && <div style={ModeStartStyle.error}>{error}</div>}

          <div style={ModeStartStyle.grid}>
            <div style={ModeStartStyle.section}>
              <h3 style={ModeStartStyle.sectionTitle}>Settings</h3>
              <div style={ModeStartStyle.sectionSub}>Pick category + difficulty, then go.</div>

              <div style={ModeStartStyle.field}>
                <span style={ModeStartStyle.label}>Category</span>
                <select
                  style={ModeStartStyle.select}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={busy}
                >
                  {categories.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={ModeStartStyle.field}>
                <span style={ModeStartStyle.label}>Difficulty</span>
                <div style={ModeStartStyle.row}>
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={{
                        ...ModeStartStyle.btn,
                        ...(difficulty === d
                          ? { background: colors.gradients.main, color: colors.neutral.white, border: 'none' }
                          : null),
                      }}
                      onClick={() => setDifficulty(d)}
                      disabled={busy}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...ModeStartStyle.row, marginTop: 14 }}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={{ ...ModeStartStyle.btn, ...ModeStartStyle.btnPrimary }}
                  onClick={start}
                  disabled={busy || !categoryId}
                >
                  Start Blitz ▶
                </button>
                {!user && (
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={ModeStartStyle.btn}
                    onClick={() => onRequireAuth?.('blitz')}
                    disabled={busy}
                  >
                    Login
                  </button>
                )}
              </div>
            </div>

            <div style={ModeStartStyle.section}>
              <h3 style={ModeStartStyle.sectionTitle}>Rules</h3>
              <div style={ModeStartStyle.sectionSub}>
                {config?.rules || '60 seconds. Each correct answer = +1.'}
              </div>
              <div style={ModeStartStyle.pills}>
                <span style={ModeStartStyle.pill}>Category: {selectedCategory?.name ?? '—'}</span>
                <span style={ModeStartStyle.pill}>Difficulty: {difficulty}</span>
                <span style={ModeStartStyle.pill}>Mode: blitz</span>
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 850,
                  color: colors.neutral[700],
                  lineHeight: 1.6,
                }}
              >
                Tip: keep tapping — every second counts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

