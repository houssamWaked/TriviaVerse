import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { STRINGS } from '@/constants/strings';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  computeGuestStoryUnlockedMax,
  loadGuestStoryProgress,
} from '@/utils/guestStoryProgress';
import type { StoryLevel, StoryPageProps, StoryProgressResponse } from '../types';

/**
 * Normalize difficulty text to a known label.
 * @param raw Raw difficulty value from the API.
 * @returns One of the known difficulty strings or an "unknown" fallback.
 */
function toDifficultyLabel(raw: string | null | undefined) {
  const d = String(raw || '').toLowerCase();
  if (d === STRINGS.STORY.difficulty.easy) return STRINGS.STORY.difficulty.easy;
  if (d === STRINGS.STORY.difficulty.medium) return STRINGS.STORY.difficulty.medium;
  if (d === STRINGS.STORY.difficulty.hard) return STRINGS.STORY.difficulty.hard;
  return STRINGS.STORY.difficulty.unknown;
}

export function useStoryPage({
  user,
  onRequireAuth,
  onPlaySession,
}: Pick<StoryPageProps, 'user' | 'onRequireAuth' | 'onPlaySession'>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [levels, setLevels] = useState<StoryLevel[]>([]);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      if (user) {
        const progress = (await api.getStoryProgress()) as StoryProgressResponse;
        setCompletedLevels(Number(progress?.completed_levels) || 0);
        setTotalLevels(Number(progress?.total_levels) || 0);
        setLevels(Array.isArray(progress?.levels) ? progress.levels : []);
      } else {
        const list = (await api.getStoryLevels()) as StoryLevel[];
        const guest = loadGuestStoryProgress();
        const unlockedMax = computeGuestStoryUnlockedMax(list);

        setCompletedLevels(0);
        setTotalLevels(Array.isArray(list) ? list.length : 0);

        setLevels(
          (Array.isArray(list) ? list : []).map((lvl) => ({
            level_id: lvl.id,
            level_number: lvl.level_number,
            title: lvl.title,
            difficulty:
              (Number(lvl.difficulty_max) || 0) <= 3
                ? STRINGS.STORY.difficulty.easy
                : (Number(lvl.difficulty_max) || 0) <= 6
                  ? STRINGS.STORY.difficulty.medium
                  : STRINGS.STORY.difficulty.hard,
            best_score: Number(guest?.bestScore?.[String(lvl.level_number)] || 0) || 0,
            stars_earned: Number(guest?.stars?.[String(lvl.level_number)] || 0) || 0,
            is_unlocked: Number(lvl.level_number) <= unlockedMax,
            is_completed: !!guest?.completed?.[String(lvl.level_number)],
          }))
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const progressPct = useMemo(() => {
    const t = Number(totalLevels) || 0;
    const c = Number(completedLevels) || 0;
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
  }, [completedLevels, totalLevels]);

  const startLevel = useCallback(
    async (levelNumber: number | null | undefined, isUnlocked: boolean) => {
      if (!isUnlocked) {
        onRequireAuth?.('story');
        return;
      }

      setBusy(true);
      setError('');
      try {
        const res = await api.startStorySession({
          level_number: Number(levelNumber),
        });
        if (!res?.session_id) throw new Error(STRINGS.STORY.errors.failedStart);
        onPlaySession?.(res.session_id, Number(levelNumber));
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [onPlaySession, onRequireAuth]
  );

  return {
    busy,
    error,
    levels,
    completedLevels,
    totalLevels,
    progressPct,
    load,
    startLevel,
    toDifficultyLabel,
  };
}
