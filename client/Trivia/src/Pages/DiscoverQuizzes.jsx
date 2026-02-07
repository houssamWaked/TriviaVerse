import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import DiscoverQuizzesStyle from '@/Styles/ComponentStyles/DiscoverQuizzesStyle';
import { getApiErrorMessage } from '@/utils/apiError';

function formatRating(avg, count) {
  const a = Number(avg);
  const c = Number(count);
  const avgText = Number.isFinite(a) ? a.toFixed(a % 1 === 0 ? 0 : 1) : '0';
  const countText = Number.isFinite(c) ? c : 0;
  return `${ICONS.common.star} ${avgText} (${countText})`;
}

export default function DiscoverQuizzes({ user, onOpenQuiz, onNavigateHome }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const canSeePrivate = !!user;

  const placeholder = canSeePrivate
    ? STRINGS.DISCOVER_QUIZZES.placeholder.loggedIn
    : STRINGS.DISCOVER_QUIZZES.placeholder.loggedOut;

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
          <span style={DiscoverQuizzesStyle.noteIcon}>{ICONS.common.bookmark}</span>
          {STRINGS.DISCOVER_QUIZZES.note.loggedOut}
        </div>
      );
    }
    return (
      <div style={DiscoverQuizzesStyle.note}>
        <span style={DiscoverQuizzesStyle.noteIcon}>{ICONS.common.lock}</span>
        {STRINGS.DISCOVER_QUIZZES.note.loggedIn}
      </div>
    );
  }, [user]);

  return (
    <div style={DiscoverQuizzesStyle.page}>
      <div style={DiscoverQuizzesStyle.container}>
        <div style={DiscoverQuizzesStyle.hero}>
          <div style={DiscoverQuizzesStyle.badge}>
            <span style={DiscoverQuizzesStyle.badgeIcon}>{ICONS.common.search}</span>
            <span style={DiscoverQuizzesStyle.badgeText}>
              {STRINGS.DISCOVER_QUIZZES.badge.text}
            </span>
            <span style={DiscoverQuizzesStyle.badgeDot}>{ICONS.brand.sparkles}</span>
          </div>
          <h1 style={DiscoverQuizzesStyle.title}>
            {STRINGS.DISCOVER_QUIZZES.titlePrefix}{' '}
            <span style={DiscoverQuizzesStyle.titleAccent}>
              {STRINGS.DISCOVER_QUIZZES.titleAccent}
            </span>{' '}
            {STRINGS.DISCOVER_QUIZZES.titleSuffix}
          </h1>
          <p style={DiscoverQuizzesStyle.subtitle}>{STRINGS.DISCOVER_QUIZZES.subtitle}</p>
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
              style={DiscoverQuizzesStyle.btnPrimary}
              disabled={busy || !String(q).trim()}
              onClick={() => doSearch(q)}
            >
              {STRINGS.DISCOVER_QUIZZES.buttons.search}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={DiscoverQuizzesStyle.btnWhite}
              onClick={onNavigateHome}
              disabled={busy}
            >
              {STRINGS.COMMON.buttons.home}
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
                      {quiz.visibility === 'private' ? (
                        <>
                          {ICONS.common.lock} {STRINGS.MY_PLAYS.visibility.private}
                        </>
                      ) : (
                        <>
                          {ICONS.common.globe} {STRINGS.MY_PLAYS.visibility.public}
                        </>
                      )}
                    </span>
                    <span style={DiscoverQuizzesStyle.pill}>
                      {formatRating(quiz.ratings_avg, quiz.ratings_count)}
                    </span>
                  </div>
                </div>

                <div style={DiscoverQuizzesStyle.meta}>
                  <span style={DiscoverQuizzesStyle.metaItem}>
                    <span style={DiscoverQuizzesStyle.metaIcon}>{ICONS.common.user}</span>
                    {quiz.owner?.username || STRINGS.DISCOVER_QUIZZES.ownerUnknown}
                  </span>
                  <span style={DiscoverQuizzesStyle.metaItem}>
                    <span style={DiscoverQuizzesStyle.metaIcon}>{ICONS.common.calendar}</span>
                    {quiz.published_at
                      ? new Date(quiz.published_at).toLocaleDateString()
                      : STRINGS.COMMON.separators.emDash}
                  </span>
                </div>

                {!!quiz.description && (
                  <div style={DiscoverQuizzesStyle.desc}>{quiz.description}</div>
                )}

                <div style={DiscoverQuizzesStyle.openHint}>
                  {STRINGS.DISCOVER_QUIZZES.openHint}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={DiscoverQuizzesStyle.empty}>
            <div style={DiscoverQuizzesStyle.emptyTitle}>
              {STRINGS.DISCOVER_QUIZZES.empty.title}
            </div>
            <div style={DiscoverQuizzesStyle.emptyText}>
              {busy ? STRINGS.DISCOVER_QUIZZES.empty.loading : STRINGS.DISCOVER_QUIZZES.empty.noQuizzes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
