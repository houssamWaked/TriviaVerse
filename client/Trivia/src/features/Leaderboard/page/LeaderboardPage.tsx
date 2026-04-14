import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import LeaderboardStyle from '@/Styles/ComponentStyles/LeaderboardStyle';
import LeaderboardEntriesList from '../components/LeaderboardEntriesList';
import { useLeaderboardData } from '../hooks/useLeaderboardData';

type LeaderboardPageProps = {
  onNavigateHome?: () => void;
};

/**
 * Leaderboard page: shows ranked users with mode/period filters.
 * @param onNavigateHome Callback to return to the home page.
 * @returns React element.
 */
export default function LeaderboardPage({ onNavigateHome }: LeaderboardPageProps) {
  const { busy, error, period, setPeriod, mode, setMode, entries, load } = useLeaderboardData();

  return (
    <div style={LeaderboardStyle.page}>
      <div style={LeaderboardStyle.container}>
        <div style={LeaderboardStyle.hero as any}>
          <div style={LeaderboardStyle.badge}>
            <span style={LeaderboardStyle.badgeIcon}>{ICONS.common.trophy}</span>
            <span style={LeaderboardStyle.badgeText}>{STRINGS.LEADERBOARD.title}</span>
            <span style={LeaderboardStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={LeaderboardStyle.title}>{STRINGS.LEADERBOARD.headline}</h1>
          <p style={LeaderboardStyle.subtitle}>{STRINGS.LEADERBOARD.subtitle}</p>
        </div>

        <div className="tv-card" style={LeaderboardStyle.card as any}>
          <div style={LeaderboardStyle.rowBetween as any}>
            <div style={LeaderboardStyle.row as any}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn as any}
                onClick={onNavigateHome}
              >
                {STRINGS.LEADERBOARD.buttons.home}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={LeaderboardStyle.btn as any}
                onClick={load}
                disabled={busy}
              >
                {STRINGS.LEADERBOARD.buttons.refresh}
              </button>
            </div>

            <div style={LeaderboardStyle.row as any}>
              <select
                style={LeaderboardStyle.select as any}
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
                style={LeaderboardStyle.select as any}
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

          {!!error && <div style={LeaderboardStyle.error as any}>{error}</div>}
          <LeaderboardEntriesList busy={busy} entries={entries} />
        </div>
      </div>
    </div>
  );
}
