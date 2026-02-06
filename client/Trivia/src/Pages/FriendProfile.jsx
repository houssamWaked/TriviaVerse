import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import FriendProfileStyle from '../Styles/ComponentStyles/FriendProfileStyle';

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

function initials(username) {
  const u = String(username || '').trim();
  if (!u) return 'P';
  return u.slice(0, 1).toUpperCase();
}

export default function FriendProfile({
  user,
  friendUserId,
  onRequireAuth,
  onBack,
  onOpenQuiz,
  onNavigateHome,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const name = useMemo(() => data?.user?.username || 'Friend', [data?.user?.username]);
  const avatarUrl = data?.user?.avatar_url || '';

  const load = async () => {
    if (!friendUserId) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.getFriendStats(friendUserId);
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user, friendUserId]);

  if (!user) {
    return (
      <div style={FriendProfileStyle.page}>
        <div style={FriendProfileStyle.container}>
          <div className="tv-card" style={FriendProfileStyle.lockCard}>
            <h2 style={FriendProfileStyle.lockTitle}>Login to view profiles</h2>
            <p style={FriendProfileStyle.lockText}>
              Compare stats, see best scores, and share private quizzes with your friends.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendProfileStyle.primaryBtn, background: colors.gradients.main }}
              onClick={() => onRequireAuth?.('friend')}
            >
              Join / Login 🚀
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendProfileStyle.secondaryBtn, background: colors.neutral.white }}
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
    <div style={FriendProfileStyle.page}>
      <div style={FriendProfileStyle.container}>
        <div style={FriendProfileStyle.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...FriendProfileStyle.btn, background: colors.neutral.white }}
            onClick={onBack}
            disabled={busy}
          >
            ← Friends
          </button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...FriendProfileStyle.btn, background: colors.neutral.white }}
              onClick={load}
              disabled={busy}
            >
              Refresh ↻
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...FriendProfileStyle.btn,
                background: colors.gradients.main,
                color: colors.neutral.white,
                border: 'none',
              }}
              onClick={onNavigateHome}
            >
              Home
            </button>
          </div>
        </div>

        {!!error && <div style={FriendProfileStyle.errorCard}>{error}</div>}

        <div className="tv-card" style={FriendProfileStyle.headerCard}>
          <div style={FriendProfileStyle.headerTop}>
            <div style={FriendProfileStyle.avatar} aria-label="Avatar">
              {avatarUrl ? (
                <img alt={name} src={avatarUrl} style={FriendProfileStyle.avatarImg} />
              ) : (
                initials(name)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h1 style={FriendProfileStyle.name}>
                {name} <span style={{ fontSize: 18 }}>🤝</span>
              </h1>
              <div style={FriendProfileStyle.sub}>
                {busy ? 'Loading…' : 'Friend profile'}
              </div>
            </div>
          </div>

          <div style={FriendProfileStyle.pills}>
            <div style={FriendProfileStyle.pill}>⭐ Level {data?.user_stats?.level ?? 1}</div>
            <div style={FriendProfileStyle.pill}>🧠 XP {data?.user_stats?.xp_total ?? 0}</div>
            <div style={FriendProfileStyle.pill}>
              🔥 Streak {data?.user_stats?.streak_days ?? 0}d
            </div>
          </div>
        </div>

        <div className="tv-card" style={FriendProfileStyle.sectionCard}>
          <h2 style={FriendProfileStyle.sectionTitle}>Best custom quiz scores</h2>
          <div style={FriendProfileStyle.sectionSub}>
            Tap a quiz to open it (if you have access).
          </div>

          <div style={FriendProfileStyle.list}>
            {(data?.custom_quiz_best || []).map((e) => (
              <button
                key={e.quiz_id}
                type="button"
                className="tv-card tv-card--hover"
                style={FriendProfileStyle.item}
                onClick={() => onOpenQuiz?.(e.quiz_id)}
                disabled={busy || !onOpenQuiz}
              >
                <div style={FriendProfileStyle.itemTop}>
                  <div style={FriendProfileStyle.itemTitle}>{e.title}</div>
                  <div style={FriendProfileStyle.scorePill}>🏆 {e.best_score}</div>
                </div>
                <div style={FriendProfileStyle.meta}>Updated {formatDate(e.updated_at)}</div>
              </button>
            ))}

            {!busy && (data?.custom_quiz_best || []).length === 0 && (
              <div style={FriendProfileStyle.meta}>No custom quiz scores yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

