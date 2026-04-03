import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import StoryStyle from '@/Styles/ComponentStyles/StoryStyle';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  computeGuestStoryUnlockedMax,
  loadGuestStoryProgress,
} from '@/utils/guestStoryProgress';

type AppUser = {
  id?: string;
  username?: string;
} | null;

type StoryLevel = {
  id?: string;
  level_id?: string;
  level_number?: number | null;
  title?: string | null;
  difficulty?: string | null;
  difficulty_max?: number | null;
  best_score?: number | null;
  stars_earned?: number | null;
  is_unlocked?: boolean | null;
  is_completed?: boolean | null;
};

type StoryProgressResponse = {
  completed_levels?: number | null;
  total_levels?: number | null;
  levels?: StoryLevel[];
};

type StoryProps = {
  user?: AppUser;
  onRequireAuth?: (mode?: string) => void;
  onNavigateHome?: () => void;
  onPlaySession?: (sessionId?: string, levelNumber?: number) => void;
};

function toDifficultyLabel(raw: string | null | undefined) {
  const d = String(raw || '').toLowerCase();
  if (d === STRINGS.STORY.difficulty.easy) return STRINGS.STORY.difficulty.easy;
  if (d === STRINGS.STORY.difficulty.medium) return STRINGS.STORY.difficulty.medium;
  if (d === STRINGS.STORY.difficulty.hard) return STRINGS.STORY.difficulty.hard;
  return STRINGS.STORY.difficulty.unknown;
}

function clampStars(n: number | string | null | undefined) {
  return Math.max(0, Math.min(3, Number(n) || 0));
}

export default function Story({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}: StoryProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [levels, setLevels] = useState<StoryLevel[]>([]);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const progressPct = useMemo(() => {
    const t = Number(totalLevels) || 0;
    const c = Number(completedLevels) || 0;
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
  }, [completedLevels, totalLevels]);

  const startLevel = async (
    levelNumber: number | null | undefined,
    isUnlocked: boolean
  ) => {
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
  };

  return (
    <div style={StoryStyle.page}>
      <div style={StoryStyle.container}>
        <div style={StoryStyle.hero}>
          <div style={StoryStyle.heroIcons}>
            <span style={StoryStyle.heroIcon}>{ICONS.common.book}</span>
            <span style={StoryStyle.heroIcon}>{ICONS.common.gamepad ?? ICONS.common.play}</span>
          </div>

          <h1 style={StoryStyle.heroTitle}>
            {`${STRINGS.STORY.titlePrefix} ${STRINGS.STORY.titleAccent} ${STRINGS.STORY.titleSuffix}`}
          </h1>

          <p style={StoryStyle.heroSubtitle}>
            {STRINGS.STORY.subtitle} <span style={StoryStyle.heroEmoji}>{ICONS.common.star}</span>
          </p>
        </div>

        <div style={StoryStyle.progressCard}>
          <div style={StoryStyle.progressTop}>
            <div style={StoryStyle.progressLeft}>
              <span style={StoryStyle.progressTarget}>{ICONS.common.target}</span>
              <span style={StoryStyle.progressLabel}>Your Progress</span>
            </div>
            <div style={StoryStyle.progressRight}>
              {completedLevels} / {totalLevels} Levels
            </div>
          </div>

          <div style={StoryStyle.progressBarOuter}>
            <div
              style={{
                ...StoryStyle.progressBarInner,
                width: `${progressPct}%`,
              } as any}
            />
          </div>
        </div>

        {!!error && <div style={StoryStyle.error}>{error}</div>}

        <div className="tv-story-grid" style={StoryStyle.levelGrid}>
          {levels.map((lvl) => {
            const unlocked = !!lvl.is_unlocked;
            const completed = !!lvl.is_completed;
            const difficulty = toDifficultyLabel(lvl.difficulty);
            const stars = clampStars(lvl.stars_earned);

            return (
              <button
                key={lvl.level_id || lvl.level_number}
                type="button"
                style={unlocked ? StoryStyle.levelCard : StoryStyle.levelCardLocked}
                disabled={busy || !unlocked}
                onClick={() => startLevel(lvl.level_number, unlocked)}
                title={unlocked ? 'Play' : 'Locked'}
              >
                <div style={StoryStyle.levelTopRow}>
                  <div
                    style={{
                      ...StoryStyle.levelBadge,
                      ...(completed
                        ? StoryStyle.levelBadgeCompleted
                        : unlocked
                          ? StoryStyle.levelBadgeUnlocked
                          : StoryStyle.levelBadgeLocked),
                    }}
                  >
                    {lvl.level_number}
                  </div>

                  <div style={StoryStyle.levelTopRight}>
                    {completed ? <span style={StoryStyle.check}>OK</span> : <span />}
                  </div>
                </div>

                <div style={StoryStyle.levelTitle}>
                  {lvl.title || STRINGS.STORY.level.titleFallback(lvl.level_number)}
                </div>

                <div
                  style={{
                    ...StoryStyle.diffPill,
                    ...(difficulty === STRINGS.STORY.difficulty.easy
                      ? StoryStyle.diffEasy
                      : difficulty === STRINGS.STORY.difficulty.medium
                        ? StoryStyle.diffMedium
                        : difficulty === STRINGS.STORY.difficulty.hard
                          ? StoryStyle.diffHard
                          : StoryStyle.diffUnknown),
                  }}
                >
                  {difficulty}
                </div>

                <div style={StoryStyle.starsRow} aria-label={`${stars} stars`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      style={i < stars ? StoryStyle.starOn : StoryStyle.starOff}
                    >
                      *
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {levels.length === 0 && !busy && (
          <div style={StoryStyle.empty}>{STRINGS.STORY.empty}</div>
        )}

        <div style={StoryStyle.bottomActions}>
          <button
            type="button"
            style={StoryStyle.smallBtn}
            onClick={load}
            disabled={busy}
            title="Refresh"
          >
            {ICONS.common.refresh ?? 'Refresh'} Refresh
          </button>
          <button
            type="button"
            style={{ ...StoryStyle.smallBtn, ...StoryStyle.smallBtnPrimary }}
            onClick={onNavigateHome}
            title="Home"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
