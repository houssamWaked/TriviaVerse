import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchLeaderboard,
  setMode,
  setPeriod,
} from '@/store/slices/leaderboardSlice';
import type { LeaderboardEntry } from '@/store/slices/leaderboardSlice';

export type { LeaderboardEntry };

/**
 * Manage leaderboard filters and data loading state.
 * @returns Filters, entries, status, and actions for the leaderboard page.
 */
export function useLeaderboardData() {
  const dispatch = useDispatch<AppDispatch>();
  const { busy, error, period, mode, entries } = useSelector(
    (state: RootState) => state.leaderboard
  );

  const load = useCallback(async () => {
    await dispatch(fetchLeaderboard());
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [load, mode, period]);

  return {
    busy,
    error,
    period,
    setPeriod: (nextPeriod: string) => dispatch(setPeriod(nextPeriod)),
    mode,
    setMode: (nextMode: string) => dispatch(setMode(nextMode)),
    entries,
    load,
  };
}
