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

function toDifficultyLabel(raw) {
  const d = String(raw || '').toLowerCase();
  if (d === STRINGS.STORY.difficulty.easy) return STRINGS.STORY.difficulty.easy;
  if (d === STRINGS.STORY.difficulty.medium)
    return STRINGS.STORY.difficulty.medium;
  if (d === STRINGS.STORY.difficulty.hard) return STRINGS.STORY.difficulty.hard;
  return STRINGS.STORY.difficulty.unknown;
}

function clampStars(n) {
  return Math.max(0, Math.min(3, Number(n) || 0));
}

export default function Story({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [levels, setLevels] = useState([]);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      if (user) {
        const p = await api.getStoryProgress();
        setCompletedLevels(Number(p?.completed_levels) || 0);
        setTotalLevels(Number(p?.total_levels) || 0);
        setLevels(Array.isArray(p?.levels) ? p.levels : []);
      } else {
        const list = await api.getStoryLevels();
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
            best_score:
              Number(guest?.bestScore?.[String(lvl.level_number)] || 0) || 0,
            stars_earned:
              Number(guest?.stars?.[String(lvl.level_number)] || 0) || 0,
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

  const startLevel = async (levelNumber, isUnlocked) => {
    if (!isUnlocked) return;

    setBusy(true);
    setError('');
    try {
      const res = await api.startStorySession({
        level_number: Number(levelNumber),
      });
      if (!res?.session_id) throw new Error(STRINGS.STORY.errors.failedStart);
      onPlaySession?.(res.session_id, levelNumber);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={StoryStyle.page}>
      <div style={StoryStyle.container}>
        {/* HERO (matches left image) */}
        <div style={StoryStyle.hero}>
          <div style={StoryStyle.heroIcons}>
            <span style={StoryStyle.heroIcon}>{ICONS.common.book}</span>
            <span style={StoryStyle.heroIcon}>
              {ICONS.common.controller ?? '🎮'}
            </span>
          </div>

          <h1 style={StoryStyle.heroTitle}>
            {STRINGS.STORY.modeTitle ?? 'Story Mode!'}
          </h1>

          <p style={StoryStyle.heroSubtitle}>
            {STRINGS.STORY.modeSubtitle ??
              'Level up through epic trivia challenges!'}{' '}
            <span style={StoryStyle.heroEmoji}>⭐</span>
          </p>
        </div>

        {/* PROGRESS CARD (replaces your pills/actions row) */}
        <div style={StoryStyle.progressCard}>
          <div style={StoryStyle.progressTop}>
            <div style={StoryStyle.progressLeft}>
              <span style={StoryStyle.progressTarget}>
                {ICONS.common.target ?? '🎯'}
              </span>
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
              }}
            />
          </div>
        </div>

        {!!error && <div style={StoryStyle.error}>{error}</div>}

        {/* LEVELS GRID (cards like left image) */}
        <div style={StoryStyle.levelGrid}>
          {levels.map((lvl) => {
            const unlocked = !!lvl.is_unlocked;
            const completed = !!lvl.is_completed;

            const difficulty = toDifficultyLabel(lvl.difficulty);
            const stars = clampStars(lvl.stars_earned);

            return (
              <button
                key={lvl.level_id || lvl.level_number}
                type="button"
                style={
                  unlocked ? StoryStyle.levelCard : StoryStyle.levelCardLocked
                }
                disabled={busy || !unlocked}
                onClick={() => startLevel(lvl.level_number, unlocked)}
                title={unlocked ? 'Play' : 'Locked'}
              >
                {/* top row: badge + check */}
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
                    {completed ? (
                      <span style={StoryStyle.check}>✓</span>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>

                {/* title */}
                <div style={StoryStyle.levelTitle}>
                  {lvl.title ||
                    STRINGS.STORY.level.titleFallback(lvl.level_number)}
                </div>

                {/* difficulty pill */}
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

                {/* stars row (bottom left like left image) */}
                <div style={StoryStyle.starsRow} aria-label={`${stars} stars`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      style={i < stars ? StoryStyle.starOn : StoryStyle.starOff}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* empty */}
        {levels.length === 0 && !busy && (
          <div style={StoryStyle.empty}>{STRINGS.STORY.empty}</div>
        )}

        {/* optional: tiny actions (not in left screenshot, but useful) */}
        <div style={StoryStyle.bottomActions}>
          <button
            type="button"
            style={StoryStyle.smallBtn}
            onClick={load}
            disabled={busy}
            title="Refresh"
          >
            {ICONS.common.refresh ?? '↻'} Refresh
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
