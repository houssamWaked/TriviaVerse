import React, { useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ClassicStyle from '@/Styles/ComponentStyles/ClassicStyle';
import { getApiErrorMessage } from '@/utils/apiError';

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function pickAccent(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}deg 92% 55%)`;
}

export default function Classic({
  user,
  onRequireAuth,
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

  const startWithCategory = async (id) => {
    const cid = String(id || '').trim();
    if (!cid) return;

    setBusy(true);
    setError('');

    try {
      const res = await api.startClassicSession({
        category_id: cid,
        difficulty,
        questions_count: clampInt(questionsCount, 1, 50),
      });
      onPlaySession?.(res.session_id);
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
        <div style={ClassicStyle.categoriesGrid}>
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
                      startWithCategory(c.id);
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

        {/* STATS */}
        <div style={ClassicStyle.statsGrid}>
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
            </div>
          </details>
        </div>

        {/* STATUS */}
        <div style={ClassicStyle.statusWrap}>
          <div style={ClassicStyle.statusText}>
            {user
              ? STRINGS.CLASSIC.status.loggedInAs(user.username)
              : 'Playing as guest (not saved to your profile)'}
          </div>
        </div>
      </div>
    </div>
  );
}
