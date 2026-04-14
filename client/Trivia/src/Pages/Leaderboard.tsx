import React from 'react';
import LeaderboardPage from '@/features/Leaderboard/page/LeaderboardPage';

type LeaderboardProps = {
  onNavigateHome?: () => void;
};

/**
 * Backward-compatible page wrapper delegating to feature-colocated page.
 * @param props Wrapper props.
 * @returns React element.
 */
export default function Leaderboard(props: LeaderboardProps) {
  return <LeaderboardPage {...props} />;
}

