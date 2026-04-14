import React from 'react';
import LeaderboardStyle from '@/Styles/ComponentStyles/LeaderboardStyle';
import { STRINGS } from '@/constants/strings';
import type { LeaderboardEntry } from '../hooks/useLeaderboardData';

type LeaderboardEntriesListProps = {
  busy: boolean;
  entries: LeaderboardEntry[];
};

/**
 * Render leaderboard entries list and empty/loading state.
 * @param props Component props.
 * @returns React element.
 */
export default function LeaderboardEntriesList({
  busy,
  entries,
}: LeaderboardEntriesListProps) {
  return (
    <div style={LeaderboardStyle.list as any}>
      {entries.length === 0 ? (
        <div style={LeaderboardStyle.emptyMessage as any}>
          {busy ? STRINGS.COMMON.loading : STRINGS.LEADERBOARD.empty.none}
        </div>
      ) : (
        entries.map((entry) => (
          <div
            key={`${entry.user_id}-${entry.rank_position}`}
            style={LeaderboardStyle.item as any}
          >
            <div style={LeaderboardStyle.left as any}>
              <div style={LeaderboardStyle.rank as any}>{entry.rank_position}</div>
              <div style={LeaderboardStyle.nameWrap as any}>
                <div style={LeaderboardStyle.name as any}>
                  {entry.username || STRINGS.COMMON.playerFallback}
                </div>
                <div style={LeaderboardStyle.meta as any}>
                  {STRINGS.LEADERBOARD.level.label} {entry.level || 1}
                </div>
              </div>
            </div>
            <div style={LeaderboardStyle.score as any}>{entry.score_value}</div>
          </div>
        ))
      )}
    </div>
  );
}
