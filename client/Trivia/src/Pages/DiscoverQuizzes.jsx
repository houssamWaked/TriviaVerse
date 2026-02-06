import React, { useCallback, useEffect, useMemo, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import DiscoverQuizzesStyle from '../Styles/ComponentStyles/DiscoverQuizzesStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function formatRating(avg, count) {
  const a = Number(avg);
  const c = Number(count);
  const avgText = Number.isFinite(a) ? a.toFixed(a % 1 === 0 ? 0 : 1) : '0';
  const countText = Number.isFinite(c) ? c : 0;
  return `⭐ ${avgText} (${countText})`;
}

export default function DiscoverQuizzes({
  user,
  onOpenQuiz,
  onNavigateHome,
}) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const canSeePrivate = !!user;

  const placeholder = canSeePrivate
    ? 'Search quizzes by title (includes private shared with you)…'
    : 'Search public quizzes by title…';

  const loadTop = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api.getTopQuizzes(20);
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const doSearch = useCallback(
    async (query) => {
      const term = String(query || '').trim();
      if (!term) {
        await loadTop();
        return;
      }

      setBusy(true);
      setError('');
      try {
        const data = await api.searchQuizzes(term, 30);
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [loadTop]
  );

  useEffect(() => {
    const term = String(q || '').trim();
    if (!term) return undefined;
    const t = window.setTimeout(() => doSearch(term), 250);
    return () => window.clearTimeout(t);
  }, [q, canSeePrivate, doSearch]);

  useEffect(() => {
    const term = String(q || '').trim();
    if (term) return;
    loadTop();
  }, [canSeePrivate, q, loadTop]);

  const hasResults = results.length > 0;

  const headerNote = useMemo(() => {
    if (!user) {
      return (
        <div style={DiscoverQuizzesStyle.note}>
          <span style={DiscoverQuizzesStyle.noteIcon}>🔓</span>
          Login to also see private quizzes shared with you.
        </div>
      );
    }
    return (
      <div style={DiscoverQuizzesStyle.note}>
        <span style={DiscoverQuizzesStyle.noteIcon}>🔒</span>
        Private quizzes shared with you can appear here.
      </div>
    );
  }, [user]);

  return (
    <div style={DiscoverQuizzesStyle.page}>
      <div style={DiscoverQuizzesStyle.container}>
        <div style={DiscoverQuizzesStyle.hero}>
          <div style={DiscoverQuizzesStyle.badge}>
            <span style={DiscoverQuizzesStyle.badgeIcon}>🔎</span>
            <span style={DiscoverQuizzesStyle.badgeText}>Discover quizzes</span>
            <span style={DiscoverQuizzesStyle.badgeDot}>✨</span>
          </div>
          <h1 style={DiscoverQuizzesStyle.title}>
            Find the <span style={DiscoverQuizzesStyle.titleAccent}>best</span> quizzes
          </h1>
          <p style={DiscoverQuizzesStyle.subtitle}>
            Search by name — results are sorted by rating, so the best rise to the top.
          </p>
        </div>

        {headerNote}

        <div className="tv-card" style={DiscoverQuizzesStyle.searchCard}>
          <div style={DiscoverQuizzesStyle.searchRow}>
            <input
              style={DiscoverQuizzesStyle.input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              disabled={busy}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{
                ...DiscoverQuizzesStyle.btn,
                background: colors.gradients.main,
                color: colors.neutral.white,
              }}
              disabled={busy || !String(q).trim()}
              onClick={() => doSearch(q)}
            >
              Search
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...DiscoverQuizzesStyle.btn, background: colors.neutral.white }}
              onClick={onNavigateHome}
              disabled={busy}
            >
              Home
            </button>
          </div>
          {!!error && <div style={DiscoverQuizzesStyle.error}>{error}</div>}
        </div>

        {hasResults ? (
          <div style={DiscoverQuizzesStyle.grid}>
            {results.map((quiz) => (
              <button
                key={quiz.id}
                type="button"
                className="tv-card tv-card--hover"
                style={DiscoverQuizzesStyle.quizCard}
                onClick={() => onOpenQuiz?.(quiz.id)}
              >
                <div style={DiscoverQuizzesStyle.cardTop}>
                  <div style={DiscoverQuizzesStyle.quizTitle}>{quiz.title}</div>
                  <div style={DiscoverQuizzesStyle.pills}>
                    <span style={DiscoverQuizzesStyle.pill}>
                      {quiz.visibility === 'private' ? '🔒 private' : '🌍 public'}
                    </span>
                    <span style={DiscoverQuizzesStyle.pill}>
                      {formatRating(quiz.ratings_avg, quiz.ratings_count)}
                    </span>
                  </div>
                </div>

                <div style={DiscoverQuizzesStyle.meta}>
                  <span style={DiscoverQuizzesStyle.metaItem}>
                    <span style={DiscoverQuizzesStyle.metaIcon}>👤</span>
                    {quiz.owner?.username || 'Unknown'}
                  </span>
                  <span style={DiscoverQuizzesStyle.metaItem}>
                    <span style={DiscoverQuizzesStyle.metaIcon}>🗓</span>
                    {quiz.published_at
                      ? new Date(quiz.published_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>

                {!!quiz.description && (
                  <div style={DiscoverQuizzesStyle.desc}>{quiz.description}</div>
                )}

                <div style={DiscoverQuizzesStyle.openHint}>Open →</div>
              </button>
            ))}
          </div>
        ) : (
          <div style={DiscoverQuizzesStyle.empty}>
            <div style={DiscoverQuizzesStyle.emptyTitle}>Top quizzes ✨</div>
            <div style={DiscoverQuizzesStyle.emptyText}>
              {busy
                ? 'Loading…'
                : 'No quizzes yet — publish some quizzes and ratings will rank them here.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
