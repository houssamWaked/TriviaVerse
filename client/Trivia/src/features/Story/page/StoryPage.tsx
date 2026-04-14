import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import StoryStyle from '@/Styles/ComponentStyles/StoryStyle';
import StoryLevelCard from '../components/StoryLevelCard';
import { useStoryPage } from '../hooks/useStoryPage';
import type { StoryPageProps } from '../types';

/**
 * Story mode start page: shows story levels, progress, and starts sessions.
 * @param user Current user snapshot (enables server-backed progress).
 * @param onPlaySession Callback invoked with a started session id.
 * @returns React element.
 */
export default function StoryPage({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}: StoryPageProps) {
  const {
    busy,
    error,
    levels,
    completedLevels,
    totalLevels,
    progressPct,
    load,
    startLevel,
    toDifficultyLabel,
  } = useStoryPage({
    user,
    onRequireAuth,
    onPlaySession,
  });

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
              }}
            />
          </div>
        </div>

        {!!error && <div style={StoryStyle.error}>{error}</div>}

        <div className="tv-story-grid" style={StoryStyle.levelGrid}>
          {levels.map((lvl) => (
            <StoryLevelCard
              key={lvl.level_id || lvl.level_number}
              level={lvl}
              busy={busy}
              onStartLevel={startLevel}
              toDifficultyLabel={toDifficultyLabel}
            />
          ))}
        </div>

        {levels.length === 0 && !busy && <div style={StoryStyle.empty}>{STRINGS.STORY.empty}</div>}

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

export type { StoryPageProps } from '../types';
