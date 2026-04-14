/* eslint-disable no-unused-vars */
import React from 'react';
import { STRINGS } from '@/constants/strings';
import StoryStyle from '@/Styles/ComponentStyles/StoryStyle';
import type { StoryLevel } from '../types';

type StoryLevelCardProps = {
  level: StoryLevel;
  busy: boolean;
  onStartLevel(levelNumber: number | null | undefined, isUnlocked: boolean): void;
  toDifficultyLabel(raw: string | null | undefined): string;
};

/**
 * Clamp stars to the [0,3] display range.
 * @param n Raw stars value.
 * @returns Clamped stars count.
 */
function clampStars(n: number | string | null | undefined) {
  return Math.max(0, Math.min(3, Number(n) || 0));
}

export default function StoryLevelCard({
  level,
  busy,
  onStartLevel,
  toDifficultyLabel,
}: StoryLevelCardProps) {
  const unlocked = !!level.is_unlocked;
  const completed = !!level.is_completed;
  const difficulty = toDifficultyLabel(level.difficulty);
  const stars = clampStars(level.stars_earned);

  return (
    <button
      type="button"
      style={unlocked ? StoryStyle.levelCard : StoryStyle.levelCardLocked}
      disabled={busy || !unlocked}
      onClick={() => onStartLevel(level.level_number, unlocked)}
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
          {level.level_number}
        </div>

        <div style={StoryStyle.levelTopRight}>
          {completed ? <span style={StoryStyle.check}>OK</span> : <span />}
        </div>
      </div>

      <div style={StoryStyle.levelTitle}>
        {level.title || STRINGS.STORY.level.titleFallback(level.level_number)}
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
          <span key={i} style={i < stars ? StoryStyle.starOn : StoryStyle.starOff}>
            *
          </span>
        ))}
      </div>
    </button>
  );
}
