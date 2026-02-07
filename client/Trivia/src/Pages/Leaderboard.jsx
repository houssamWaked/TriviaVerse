import React, { useEffect, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import LeaderboardStyle from '../Styles/ComponentStyles/LeaderboardStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function Leaderboard({ onNavigateHome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all_time');
  const [mode, setMode] = useState('global');
  const [entries, setEntries] = useState([]);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.getLeaderboard({ period, mode });
      setEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, mode]);

  return (
    <div style={LeaderboardStyle.page}>
      <div style={LeaderboardStyle.container}>
        <div style={LeaderboardStyle.hero}>
          <div style={LeaderboardStyle.badge}>
            <span style={LeaderboardStyle.badgeIcon}>🏆</span>
            <span style={LeaderboardStyle.badgeText}>Leaderboard</span>
            <span style={LeaderboardStyle.badgeDot}>✨</span>
          </div>
          <h1 style={LeaderboardStyle.title}>Top Players</h1>
          <p style={LeaderboardStyle.subtitle}>
            Pick a mode and see who’s dominating right now.
          </p>
        </div>

        <div className="tv-card" style={LeaderboardStyle.card}>
          <div style={{ ...LeaderboardStyle.row, justifyContent: 'space-between' }}>
            <div style={LeaderboardStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn}
                onClick={onNavigateHome}
              >
                Home
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn}
                onClick={load}
                disabled={busy}
              >
                Refresh
              </button>
            </div>

            <div style={LeaderboardStyle.row}>
              <select
                style={LeaderboardStyle.select}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                disabled={busy}
              >
                {['global', 'story', 'millionaire', 'classic', 'blitz', 'custom'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                style={LeaderboardStyle.select}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={busy}
              >
                <option value="all_time">all_time</option>
                <option value="weekly">weekly</option>
              </select>
            </div>
          </div>

          {!!error && <div style={LeaderboardStyle.error}>{error}</div>}

          <div style={LeaderboardStyle.list}>
            {entries.length === 0 ? (
              <div style={{ fontWeight: 850, color: colors.neutral[700] }}>
                {busy ? 'Loading…' : 'No leaderboard entries yet.'}
              </div>
            ) : (
              entries.map((e) => (
                <div key={`${e.user_id}-${e.rank_position}`} style={LeaderboardStyle.item}>
                  <div style={LeaderboardStyle.left}>
                    <div style={LeaderboardStyle.rank}>{e.rank_position}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={LeaderboardStyle.name}>{e.username || 'Player'}</div>
                      <div style={LeaderboardStyle.meta}>Level {e.level || 1}</div>
                    </div>
                  </div>
                  <div style={LeaderboardStyle.score}>{e.score_value}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

