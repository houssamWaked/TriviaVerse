import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import StoryStyle from '@/Styles/ComponentStyles/StoryStyle';
import { getApiErrorMessage } from '@/utils/apiError';
import { computeGuestStoryUnlockedMax, loadGuestStoryProgress } from '@/utils/guestStoryProgress';

function toDifficultyLabel(raw) {
  const d = String(raw || '').toLowerCase();
  if (d === STRINGS.STORY.difficulty.easy) return STRINGS.STORY.difficulty.easy;
  if (d === STRINGS.STORY.difficulty.medium) return STRINGS.STORY.difficulty.medium;
  if (d === STRINGS.STORY.difficulty.hard) return STRINGS.STORY.difficulty.hard;
  return STRINGS.STORY.difficulty.unknown;
}

function starsText(n) {
  const x = Math.max(0, Math.min(3, Number(n) || 0));
  return ICONS.common.star.repeat(x) + ICONS.common.starEmpty.repeat(3 - x);
}

export default function Story({ user, onRequireAuth, onNavigateHome, onPlaySession }) {
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
            best_score: Number(guest?.bestScore?.[String(lvl.level_number)] || 0) || 0,
            stars_earned: 0,
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

  const progressPill = useMemo(() => {
    if (!user) return 'Playing as guest (saved locally)';
    return STRINGS.STORY.progress.loggedIn(completedLevels, totalLevels);
  }, [user, completedLevels, totalLevels]);

  const starsSaved = useMemo(() => {
    if (!user) return 0;
    return (levels || []).reduce((acc, l) => acc + (Number(l.stars_earned) || 0), 0);
  }, [user, levels]);

  const startLevel = async (levelNumber, isUnlocked) => {
    if (!isUnlocked) return;

    setBusy(true);
    setError('');
    try {
      const res = await api.startStorySession({ level_number: Number(levelNumber) });
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
        <div style={StoryStyle.hero}>
          <div style={StoryStyle.badge}>
            <span style={StoryStyle.badgeIcon}>{ICONS.common.book}</span>
            <span style={StoryStyle.badgeText}>{STRINGS.STORY.badge.text}</span>
            <span style={StoryStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={StoryStyle.title}>
            {STRINGS.STORY.titlePrefix}{' '}
            <span style={StoryStyle.titleAccent}>{STRINGS.STORY.titleAccent}</span>{' '}
            {STRINGS.STORY.titleSuffix}
          </h1>
          <p style={StoryStyle.subtitle}>{STRINGS.STORY.subtitle}</p>
        </div>

        <div className="tv-card" style={StoryStyle.card}>
          <div style={StoryStyle.topRow}>
            <div style={StoryStyle.pills}>
              <span style={StoryStyle.pill}>{progressPill}</span>
              {user && <span style={StoryStyle.pill}>{STRINGS.STORY.starsSaved(starsSaved)}</span>}
            </div>

            <div style={StoryStyle.topActions}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={StoryStyle.btnWhite}
                onClick={load}
                disabled={busy}
              >
                {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={StoryStyle.btnPrimary}
                onClick={onNavigateHome}
              >
                {STRINGS.COMMON.buttons.home}
              </button>
            </div>
          </div>

          {!!error && <div style={StoryStyle.error}>{error}</div>}

          <div style={StoryStyle.grid}>
            {levels.map((lvl) => {
              const unlocked = !!lvl.is_unlocked;
              const completed = !!lvl.is_completed;
              const label = toDifficultyLabel(lvl.difficulty);

              return (
                <button
                  key={lvl.level_id || lvl.level_number}
                  type="button"
                  className="tv-card tv-card--hover"
                  style={unlocked ? StoryStyle.levelCard : StoryStyle.levelCardLocked}
                  disabled={busy || !unlocked}
                  onClick={() => startLevel(lvl.level_number, unlocked)}
                  title={
                    unlocked ? STRINGS.STORY.tooltips.play : STRINGS.STORY.tooltips.locked
                  }
                >
                  <div style={StoryStyle.levelTop}>
                    <div>
                      <div style={StoryStyle.levelNum}>
                        {STRINGS.STORY.level.label} {lvl.level_number}
                      </div>
                      <div style={StoryStyle.levelTitle}>
                        {lvl.title || STRINGS.STORY.level.titleFallback(lvl.level_number)}
                      </div>
                    </div>
                    <div style={StoryStyle.metaItem}>
                      {unlocked ? ICONS.common.unlock : ICONS.common.lock}{' '}
                      {completed ? STRINGS.STORY.level.done : STRINGS.STORY.level.play}
                    </div>
                  </div>

                  <div style={StoryStyle.meta}>
                    <span style={StoryStyle.metaItem}>
                      {ICONS.common.slider} {label}
                    </span>
                    <span style={StoryStyle.metaItem}>
                      {ICONS.common.trophy} {lvl.best_score ?? 0}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {levels.length === 0 && !busy && (
            <div style={StoryStyle.empty}>{STRINGS.STORY.empty}</div>
          )}
        </div>
      </div>
    </div>
  );
}
