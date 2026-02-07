import React, { useEffect, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import LeaderboardStyle from '@/Styles/ComponentStyles/LeaderboardStyle';
import { getApiErrorMessage } from '@/utils/apiError';

export default function Leaderboard({ onNavigateHome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(STRINGS.LEADERBOARD.periods.allTime);
  const [mode, setMode] = useState(STRINGS.LEADERBOARD.modes.global);
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
            <span style={LeaderboardStyle.badgeIcon}>{ICONS.common.trophy}</span>
            <span style={LeaderboardStyle.badgeText}>{STRINGS.LEADERBOARD.title}</span>
            <span style={LeaderboardStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={LeaderboardStyle.title}>{STRINGS.LEADERBOARD.headline}</h1>
          <p style={LeaderboardStyle.subtitle}>{STRINGS.LEADERBOARD.subtitle}</p>
        </div>

        <div className="tv-card" style={LeaderboardStyle.card}>
          <div style={LeaderboardStyle.rowBetween}>
            <div style={LeaderboardStyle.row}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn}
                onClick={onNavigateHome}
              >
                {STRINGS.LEADERBOARD.buttons.home}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn}
                onClick={load}
                disabled={busy}
              >
                {STRINGS.LEADERBOARD.buttons.refresh}
              </button>
            </div>

            <div style={LeaderboardStyle.row}>
              <select
                style={LeaderboardStyle.select}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                disabled={busy}
              >
                {Object.values(STRINGS.LEADERBOARD.modes).map((m) => (
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
                <option value={STRINGS.LEADERBOARD.periods.allTime}>
                  {STRINGS.LEADERBOARD.periods.allTime}
                </option>
                <option value={STRINGS.LEADERBOARD.periods.weekly}>
                  {STRINGS.LEADERBOARD.periods.weekly}
                </option>
              </select>
            </div>
          </div>

          {!!error && <div style={LeaderboardStyle.error}>{error}</div>}

          <div style={LeaderboardStyle.list}>
            {entries.length === 0 ? (
              <div style={LeaderboardStyle.emptyMessage}>
                {busy ? STRINGS.COMMON.loading : STRINGS.LEADERBOARD.empty.none}
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={`${e.user_id}-${e.rank_position}`}
                  style={LeaderboardStyle.item}
                >
                  <div style={LeaderboardStyle.left}>
                    <div style={LeaderboardStyle.rank}>{e.rank_position}</div>
                    <div style={LeaderboardStyle.nameWrap}>
                      <div style={LeaderboardStyle.name}>
                        {e.username || STRINGS.COMMON.playerFallback}
                      </div>
                      <div style={LeaderboardStyle.meta}>
                        {STRINGS.LEADERBOARD.level.label} {e.level || 1}
                      </div>
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
