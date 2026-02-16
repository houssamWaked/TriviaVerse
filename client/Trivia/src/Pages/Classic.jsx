import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ClassicStyle from '@/Styles/ComponentStyles/ClassicStyle';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  computeGuestClassicUnlockedMax,
  loadGuestClassicProgress,
} from '@/utils/guestClassicProgress';

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function toDifficultyLabel(max) {
  const m = Number(max) || 0;
  if (m <= 3) return 'easy';
  if (m <= 6) return 'medium';
  return 'hard';
}

function clampStars(n) {
  return Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
}

function pickAccent(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}deg 92% 55%)`;
}

export default function Classic({
  user,
  onNavigateHome,
  onPlaySession,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});

  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState(
    STRINGS.CLASSIC.difficulty.options[0]
  );
  const [questionsCount, setQuestionsCount] = useState(10);

  const [levelsBusy, setLevelsBusy] = useState(false);
  const [levelsError, setLevelsError] = useState('');
  const [levels, setLevels] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.listCategories(), api.getHomeMetrics()])
      .then(([cats, m]) => {
        if (cancelled) return;
        const rows = Array.isArray(cats) ? cats : [];
        setCategories(rows);
        setMetrics(m || null);
        if (!categoryId && rows[0]?.id) setCategoryId(rows[0].id);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!categories.length) return () => {};

    Promise.all(
      categories.map(async (c) => {
        try {
          const s = await api.getCategoryStats(c.id);
          return [c.id, Number(s?.questions_available)];
        } catch {
          return [c.id, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next = {};
      for (const [id, count] of entries) {
        if (!id) continue;
        if (Number.isFinite(count)) next[id] = count;
      }
      setCategoryCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, [categories]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  useEffect(() => {
    let cancelled = false;
    if (!categoryId) return () => {};

    setLevelsBusy(true);
    setLevelsError('');
    setLevels([]);

    api
      .getClassicCategoryLevels(categoryId)
      .then((res) => {
        if (cancelled) return;
        setLevels(Array.isArray(res?.levels) ? res.levels : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLevelsError(getApiErrorMessage(err));
        setLevels([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLevelsBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    let cancelled = false;
    if (!user || !categoryId) {
      setProgress(null);
      return () => {};
    }

    setLevelsError('');

    api
      .getClassicCategoryProgress(categoryId)
      .then((res) => {
        if (cancelled) return;
        setProgress(res || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLevelsError(getApiErrorMessage(err));
        setProgress(null);
      });

    return () => {
      cancelled = true;
    };
  }, [!!user, user?.id, categoryId]);

  const displayLevels = useMemo(() => {
    if (progress && Array.isArray(progress?.levels)) return progress.levels;

    const rows = Array.isArray(levels) ? levels : [];
    const guest = loadGuestClassicProgress(categoryId);
    const unlockedMax = computeGuestClassicUnlockedMax(categoryId, rows);

    return rows
      .slice()
      .sort((a, b) => Number(a?.level_number) - Number(b?.level_number))
      .map((lvl) => {
        const n = Number(lvl.level_number);
        return {
          level_id: lvl.id,
          level_number: n,
          title: lvl.title,
          difficulty: toDifficultyLabel(lvl.difficulty_max),
          best_score: Number(guest?.bestScore?.[String(n)] || 0) || 0,
          stars_earned: Number(guest?.stars?.[String(n)] || 0) || 0,
          is_unlocked: Number.isFinite(n) ? n <= unlockedMax : false,
          is_completed: !!guest?.completed?.[String(n)],
          pool_count: lvl.pool_count ?? null,
          difficulty_min: lvl.difficulty_min ?? null,
          difficulty_max: lvl.difficulty_max ?? null,
          xp_reward: lvl.xp_reward ?? null,
        };
      });
  }, [progress, levels, categoryId]);

  const progressSummary = useMemo(() => {
    const list = Array.isArray(displayLevels) ? displayLevels : [];
    if (progress && typeof progress === 'object') {
      return {
        completed: Number(progress.completed_levels) || 0,
        total: Number(progress.total_levels) || list.length || 0,
      };
    }
    const completed = list.filter((l) => l?.is_completed).length;
    return { completed, total: list.length };
  }, [displayLevels, progress]);

  const progressPct = useMemo(() => {
    const t = Number(progressSummary.total) || 0;
    const c = Number(progressSummary.completed) || 0;
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
  }, [progressSummary]);

  const startLegacy = async () => {
    if (!categoryId) return;
    setBusy(true);
    setError('');

    try {
      const res = await api.startClassicSession({
        category_id: categoryId,
        difficulty,
        questions_count: clampInt(questionsCount, 1, 50),
      });
      if (res?.session_id) onPlaySession?.(res.session_id, categoryId, null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startLevel = async (levelNumber, unlocked) => {
    if (!categoryId) return;
    if (!unlocked) return;

    setBusy(true);
    setError('');

    try {
      const res = await api.startClassicSession({
        category_id: categoryId,
        level_number: Number(levelNumber),
      });
      if (!res?.session_id) throw new Error('Failed to start level');
      onPlaySession?.(res.session_id, categoryId, Number(levelNumber));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={ClassicStyle.page}>
      <div style={ClassicStyle.container}>
        {/* HERO */}
        <div style={ClassicStyle.hero}>
          <div style={ClassicStyle.modePill}>
            <span style={ClassicStyle.modePillIcon}>{ICONS.common.trophy}</span>
            <span style={ClassicStyle.modePillText}>Classic Mode</span>
          </div>

          <h1 style={ClassicStyle.title}>{STRINGS.CLASSIC.title}</h1>
          <p style={ClassicStyle.subtitle}>{STRINGS.CLASSIC.subtitle}</p>

          <div style={ClassicStyle.heroActions}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={ClassicStyle.heroBtnGhost}
              onClick={onNavigateHome}
              disabled={busy}
            >
              {ICONS.common.close} {STRINGS.COMMON.buttons.home}
            </button>
          </div>
        </div>

        {!!error && (
          <div className="tv-card" style={ClassicStyle.errorCard}>
            <div style={ClassicStyle.errorText}>{error}</div>
          </div>
        )}

        {/* GRID */}
        <div className="tv-classic-grid" style={ClassicStyle.categoriesGrid}>
          {categories.length === 0
            ? Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={`sk-${idx}`}
                  className="tv-card"
                  style={ClassicStyle.skeletonCard}
                >
                  <div style={ClassicStyle.skeletonIcon} />
                  <div style={ClassicStyle.skeletonLine1} />
                  <div style={ClassicStyle.skeletonLine2} />
                </div>
              ))
            : categories.map((c) => {
                const accent = pickAccent(c.id || c.name);
                const isSelected = c.id === categoryId;
                const count = categoryCounts[c.id];

                return (
                  <button
                    key={c.id}
                    type="button"
                    className="tv-card tv-card--hover"
                    onClick={() => {
                      setCategoryId(c.id);
                    }}
                    disabled={busy}
                    style={ClassicStyle.categoryBtn(isSelected)}
                  >
                    <div
                      style={ClassicStyle.categoryIconTile(accent)}
                      aria-hidden="true"
                    >
                      <span style={ClassicStyle.categoryIconChar}>
                        {c.icon || ICONS.common.diamond}
                      </span>
                    </div>

                    <div style={ClassicStyle.categoryName}>{c.name}</div>
                    <div style={ClassicStyle.categoryCount}>
                      {STRINGS.CLASSIC.questionsAvailable(
                        Number.isFinite(Number(count)) ? count : null
                      )}
                    </div>
                  </button>
                );
              })}
        </div>

        {/* LEVELS (per category) */}
        <div className="tv-card" style={ClassicStyle.levelsCard}>
          <div style={ClassicStyle.levelsHeader}>
            <div style={ClassicStyle.levelsTitleWrap}>
              <div style={ClassicStyle.levelsTitle}>
                {selectedCategory
                  ? `${selectedCategory.name} levels`
                  : STRINGS.CLASSIC.levels.title}
              </div>
              <div style={ClassicStyle.levelsSubtitle}>
                {STRINGS.CLASSIC.levels.subtitle}
              </div>
            </div>

            <div style={ClassicStyle.levelsActions}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={ClassicStyle.levelsActionBtn}
                onClick={() => {
                  if (!categoryId) return;
                  setProgress(null);
                  setLevels([]);
                  setLevelsBusy(true);
                  api
                    .getClassicCategoryLevels(categoryId)
                    .then((res) => setLevels(Array.isArray(res?.levels) ? res.levels : []))
                    .catch((err) => setLevelsError(getApiErrorMessage(err)))
                    .finally(() => setLevelsBusy(false));
                  if (user) {
                    api
                      .getClassicCategoryProgress(categoryId)
                      .then((res) => setProgress(res || null))
                      .catch(() => {});
                  }
                }}
                disabled={busy || !categoryId}
              >
                {ICONS.common.refresh} {STRINGS.COMMON.buttons.refresh}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={ClassicStyle.levelsSubtitle}>
              {ICONS.common.target}{' '}
              {progressSummary.completed} / {progressSummary.total}{' '}
              Levels {STRINGS.COMMON.separators.dot}{' '}
              {progressPct}%
            </div>
            <div
              style={{
                marginTop: 8,
                height: 10,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(255,44,128,0.88), rgba(139,44,255,0.88))',
                }}
              />
            </div>
          </div>

          {!!levelsError && (
            <div style={{ ...ClassicStyle.levelsEmpty, marginTop: 12 }}>
              {levelsError}
            </div>
          )}

          {levelsBusy ? (
            <div className="tv-classic-level-grid" style={{ marginTop: 14 }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`lvl-sk-${idx}`} className="tv-card" style={ClassicStyle.skeletonCard}>
                  <div style={ClassicStyle.skeletonLine1} />
                  <div style={ClassicStyle.skeletonLine2} />
                </div>
              ))}
            </div>
          ) : displayLevels.length > 0 ? (
            <div className="tv-classic-level-grid">
              {displayLevels.map((lvl) => {
                const unlocked = !!lvl.is_unlocked;
                const locked = !unlocked;
                const stars = clampStars(lvl.stars_earned);
                const diff = String(lvl.difficulty || '').toLowerCase();

                return (
                  <button
                    key={lvl.level_id || lvl.level_number}
                    type="button"
                    className="tv-card tv-card--hover"
                    style={ClassicStyle.levelCard(locked)}
                    disabled={busy || locked}
                    onClick={() => startLevel(lvl.level_number, unlocked)}
                    title={locked ? 'Locked' : 'Play'}
                  >
                    <div style={ClassicStyle.levelTopRow}>
                      <span
                        style={{
                          ...ClassicStyle.levelBadge,
                          ...(locked ? ClassicStyle.levelBadgeLocked : {}),
                        }}
                      >
                        {lvl.level_number}
                      </span>
                      <span style={ClassicStyle.starsRow} aria-label={`${stars} stars`}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={i}
                            style={i < stars ? ClassicStyle.starOn : ClassicStyle.starOff}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                    </div>

                    <div style={ClassicStyle.levelTitle}>
                      {lvl.title || `Level ${lvl.level_number}`}
                    </div>

                    <div style={ClassicStyle.levelMetaRow}>
                      <span
                        style={{
                          ...ClassicStyle.diffPill,
                          ...(diff === 'easy'
                            ? ClassicStyle.diffEasy
                            : diff === 'medium'
                              ? ClassicStyle.diffMedium
                              : ClassicStyle.diffHard),
                        }}
                      >
                        {diff || 'difficulty'}
                      </span>
                      {lvl.pool_count != null ? (
                        <span style={ClassicStyle.poolCount}>
                          {Number(lvl.pool_count) || 0} questions
                        </span>
                      ) : null}
                      {!unlocked ? (
                        <span style={ClassicStyle.poolCount}>
                          {ICONS.common.lock} Locked
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={ClassicStyle.levelsEmpty}>
              {STRINGS.CLASSIC.levels.empty}
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={ClassicStyle.levelsActionBtn}
                  onClick={startLegacy}
                  disabled={busy || !categoryId}
                >
                  {ICONS.common.play} {STRINGS.CLASSIC.levels.playEndless}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="tv-classic-stats-grid" style={ClassicStyle.statsGrid}>
          {[
            {
              value: String(categories.length || 0),
              label: STRINGS.CLASSIC.stats.categories,
            },
            {
              value:
                metrics?.questions != null
                  ? `${metrics.questions.toLocaleString()}+`
                  : STRINGS.COMMON.separators.emDash,
              label: STRINGS.CLASSIC.stats.totalQuestions,
            },
            {
              value: STRINGS.COMMON.separators.infinity,
              label: STRINGS.CLASSIC.stats.endlessFun,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="tv-card"
              style={ClassicStyle.statsCard}
            >
              <div style={ClassicStyle.statsValue}>{s.value}</div>
              <div style={ClassicStyle.statsLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ADVANCED (styled like the reference bar) */}
        <div style={ClassicStyle.advancedWrap}>
          <details className="tv-card" style={ClassicStyle.advancedDetails}>
            <summary style={ClassicStyle.advancedSummary}>
              {ICONS.common.play} {STRINGS.CLASSIC.advanced.title}
            </summary>

            <div style={ClassicStyle.advancedBody}>
              <div style={ClassicStyle.advancedRow}>
                <div style={ClassicStyle.advancedGroup}>
                  <div style={ClassicStyle.advancedLabel}>
                    {STRINGS.CLASSIC.difficultyTitle}
                  </div>
                  <div style={ClassicStyle.pillsRow}>
                    {STRINGS.CLASSIC.difficulty.options.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="tv-card tv-card--hover"
                        disabled={busy}
                        onClick={() => setDifficulty(d)}
                        style={ClassicStyle.pillBtn(difficulty === d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={ClassicStyle.advancedGroup}>
                  <div style={ClassicStyle.advancedLabel}>
                    {STRINGS.CLASSIC.advanced.questionsLabel}
                  </div>
                  <input
                    style={ClassicStyle.questionsInput}
                    type="number"
                    min={1}
                    max={50}
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>

              <div style={ClassicStyle.advancedCurrent}>
                {STRINGS.CLASSIC.advanced.currentPrefix}{' '}
                {selectedCategory
                  ? selectedCategory.name
                  : STRINGS.COMMON.separators.emDash}{' '}
                {STRINGS.COMMON.separators.dot} {difficulty}{' '}
                {STRINGS.COMMON.separators.dot}{' '}
                {clampInt(questionsCount, 1, 50)}{' '}
                {STRINGS.CLASSIC.advanced.questionsSuffix}
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={ClassicStyle.levelsActionBtn}
                  onClick={startLegacy}
                  disabled={busy || !categoryId}
                >
                  {ICONS.common.play} {STRINGS.CLASSIC.advanced.playEndless}
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* STATUS */}
        <div style={ClassicStyle.statusWrap}>
          <div style={ClassicStyle.statusText}>
            {user
              ? STRINGS.CLASSIC.status.loggedInAs(user.username)
              : STRINGS.CLASSIC.status.guest}
          </div>
        </div>
      </div>
    </div>
  );
}
