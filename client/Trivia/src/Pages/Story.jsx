import React, { useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import StoryStyle from '../Styles/ComponentStyles/StoryStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function toDifficultyLabel(raw) {
  const d = String(raw || '').toLowerCase();
  if (d === 'easy') return 'easy';
  if (d === 'medium') return 'medium';
  if (d === 'hard') return 'hard';
  return 'unknown';
}

function starsText(n) {
  const x = Math.max(0, Math.min(3, Number(n) || 0));
  return '⭐'.repeat(x) + '☆'.repeat(3 - x);
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
        setCompletedLevels(0);
        setTotalLevels(Array.isArray(list) ? list.length : 0);
        setLevels(
          (Array.isArray(list) ? list : []).map((lvl) => ({
            level_id: lvl.id,
            level_number: lvl.level_number,
            title: lvl.title,
            difficulty:
              (Number(lvl.difficulty_max) || 0) <= 3
                ? 'easy'
                : (Number(lvl.difficulty_max) || 0) <= 6
                  ? 'medium'
                  : 'hard',
            best_score: 0,
            stars_earned: 0,
            is_unlocked: false,
            is_completed: false,
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
    if (!user) return 'Login to play';
    return `🏁 ${completedLevels}/${totalLevels} completed`;
  }, [user, completedLevels, totalLevels]);

  const starsSaved = useMemo(() => {
    if (!user) return 0;
    return (levels || []).reduce((acc, l) => acc + (Number(l.stars_earned) || 0), 0);
  }, [user, levels]);

  const startLevel = async (levelNumber, isUnlocked) => {
    if (!user) return onRequireAuth?.('story');
    if (!isUnlocked) return;

    setBusy(true);
    setError('');
    try {
      const res = await api.startStorySession({ level_number: Number(levelNumber) });
      if (!res?.session_id) throw new Error('Failed to start session');
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
            <span style={StoryStyle.badgeIcon}>📚</span>
            <span style={StoryStyle.badgeText}>Story Mode</span>
            <span style={StoryStyle.badgeDot}>✨</span>
          </div>
          <h1 style={StoryStyle.title}>
            Your <span style={StoryStyle.titleAccent}>adventure</span> starts here
          </h1>
          <p style={StoryStyle.subtitle}>
            Beat levels, earn stars, and unlock the next chapter. Fast taps, smart brain.
          </p>
        </div>

        <div className="tv-card" style={StoryStyle.card}>
          <div style={StoryStyle.topRow}>
            <div style={StoryStyle.pills}>
              <span style={StoryStyle.pill}>{progressPill}</span>
              {user && <span style={StoryStyle.pill}>⭐ {starsSaved} stars</span>}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{ ...StoryStyle.btn, background: colors.neutral.white }}
                onClick={load}
                disabled={busy}
              >
                Refresh ↻
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{
                  ...StoryStyle.btn,
                  background: colors.gradients.main,
                  color: colors.neutral.white,
                  border: 'none',
                }}
                onClick={onNavigateHome}
              >
                Home
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
                  style={{
                    ...StoryStyle.levelCard,
                    ...(unlocked ? null : StoryStyle.locked),
                  }}
                  disabled={busy || (!unlocked && !!user)}
                  onClick={() => startLevel(lvl.level_number, unlocked)}
                  title={
                    !user
                      ? 'Login to play'
                      : unlocked
                        ? 'Play'
                        : 'Locked'
                  }
                >
                  <div style={StoryStyle.levelTop}>
                    <div>
                      <div style={StoryStyle.levelNum}>LEVEL {lvl.level_number}</div>
                      <div style={StoryStyle.levelTitle}>{lvl.title || `Level ${lvl.level_number}`}</div>
                    </div>
                    <div style={StoryStyle.metaItem}>
                      {unlocked ? '🔓' : '🔒'} {completed ? 'Done' : 'Play'}
                    </div>
                  </div>

                  <div style={StoryStyle.meta}>
                    <span style={StoryStyle.metaItem}>🎚 {label}</span>
                    {user && (
                      <>
                        <span style={StoryStyle.metaItem}>{starsText(lvl.stars_earned)}</span>
                        <span style={StoryStyle.metaItem}>🏆 {lvl.best_score ?? 0}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {levels.length === 0 && !busy && <div style={StoryStyle.empty}>No levels yet.</div>}
        </div>
      </div>
    </div>
  );
}
