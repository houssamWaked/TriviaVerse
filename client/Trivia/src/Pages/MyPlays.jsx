import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import MyPlaysStyle from '../Styles/ComponentStyles/MyPlaysStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function formatDate(d) {
  if (!d) return '—';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString();
}

export default function MyPlays({ user, onRequireAuth, onOpenQuiz, onNavigateHome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [entries, setEntries] = useState([]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api.listMyPlayedQuizzes();
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const filtered = useMemo(() => {
    const f = String(filter || '').trim().toLowerCase();
    if (!f) return entries;
    return entries.filter((e) => String(e.title || '').toLowerCase().includes(f));
  }, [entries, filter]);

  if (!user) {
    return (
      <div style={MyPlaysStyle.page}>
        <div style={MyPlaysStyle.container}>
          <div className="tv-card" style={MyPlaysStyle.lockCard}>
            <h2 style={MyPlaysStyle.lockTitle}>Login to see your plays</h2>
            <p style={MyPlaysStyle.lockText}>
              We’ll show every quiz you played and your best score.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...MyPlaysStyle.primaryBtn, background: colors.gradients.main }}
              onClick={() => onRequireAuth?.('my-plays')}
            >
              Join / Login 🚀
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...MyPlaysStyle.secondaryBtn, background: colors.neutral.white }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={MyPlaysStyle.page}>
      <div style={MyPlaysStyle.container}>
        <div style={MyPlaysStyle.hero}>
          <div style={MyPlaysStyle.badge}>
            <span style={MyPlaysStyle.badgeIcon}>🎮</span>
            <span style={MyPlaysStyle.badgeText}>My plays</span>
            <span style={MyPlaysStyle.badgeDot}>✨</span>
          </div>
          <h1 style={MyPlaysStyle.title}>
            Your best <span style={MyPlaysStyle.titleAccent}>scores</span>
          </h1>
          <p style={MyPlaysStyle.subtitle}>
            Click any quiz to play again and beat your record.
          </p>
        </div>

        <div className="tv-card" style={MyPlaysStyle.card}>
          <div style={MyPlaysStyle.topRow}>
            <input
              style={MyPlaysStyle.input}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by quiz title…"
              disabled={busy}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...MyPlaysStyle.btn, background: colors.neutral.white }}
              onClick={load}
              disabled={busy}
            >
              Refresh ↻
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...MyPlaysStyle.btn,
                background: colors.gradients.main,
                color: colors.neutral.white,
              }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>

          {!!error && <div style={MyPlaysStyle.error}>{error}</div>}

          <div style={MyPlaysStyle.list}>
            {filtered.map((e) => (
              <button
                key={e.quiz_id}
                type="button"
                className="tv-card tv-card--hover"
                style={MyPlaysStyle.item}
                disabled={busy}
                onClick={() => onOpenQuiz?.(e.quiz_id)}
              >
                <div style={MyPlaysStyle.itemTop}>
                  <div style={MyPlaysStyle.itemTitle}>{e.title}</div>
                  <div style={MyPlaysStyle.scorePill}>🏅 {e.best_score}</div>
                </div>
                <div style={MyPlaysStyle.meta}>
                  <span style={MyPlaysStyle.metaItem}>
                    {e.visibility === 'private' ? '🔒 private' : '🌍 public'}
                  </span>
                  <span style={MyPlaysStyle.metaItem}>🗓 {formatDate(e.updated_at)}</span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && !busy && (
              <div style={MyPlaysStyle.empty}>
                No plays yet — open a quiz and press Play ▶
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

