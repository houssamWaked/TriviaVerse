import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage } from '@/utils/apiError';

export type LeaderboardEntry = {
  user_id: string;
  rank_position: number;
  username?: string | null;
  level?: number | null;
  score_value: number | string;
};

type LeaderboardResponse = {
  entries?: LeaderboardEntry[];
};

/**
 * Manage leaderboard filters and data loading state.
 * @returns Filters, entries, status, and actions for the leaderboard page.
 */
export function useLeaderboardData() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<string>(STRINGS.LEADERBOARD.periods.allTime);
  const [mode, setMode] = useState<string>(STRINGS.LEADERBOARD.modes.global);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const res = (await api.getLeaderboard({ period, mode })) as LeaderboardResponse | null;
      setEntries(Array.isArray(res?.entries) ? res.entries : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [mode, period]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    busy,
    error,
    period,
    setPeriod,
    mode,
    setMode,
    entries,
    load,
  };
}
