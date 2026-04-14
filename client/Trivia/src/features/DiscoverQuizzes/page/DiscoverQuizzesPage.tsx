import React, { useMemo } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import DiscoverQuizzesStyle from '@/Styles/ComponentStyles/DiscoverQuizzesStyle';
import DiscoverQuizCard from '@/features/DiscoverQuizzes/components/DiscoverQuizCard';
import { useDiscoverQuizzes } from '@/features/DiscoverQuizzes/hooks/useDiscoverQuizzes';
import type { DiscoverQuizzesPageProps } from '@/features/DiscoverQuizzes/types';

export default function DiscoverQuizzesPage({
  user,
  onOpenQuiz,
  onNavigateHome,
}: DiscoverQuizzesPageProps) {
  const { q, setQ, busy, error, results, placeholder, doSearch } = useDiscoverQuizzes(user);
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
              disabled={false}
            />
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={DiscoverQuizzesStyle.btnPrimary}
              disabled={busy || !String(q).trim()}
              onClick={() => void doSearch(q)}
            >
              {STRINGS.DISCOVER_QUIZZES.buttons.search}
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={DiscoverQuizzesStyle.btnWhite}
              onClick={onNavigateHome}
              disabled={false}
            >
              {STRINGS.COMMON.buttons.home}
            </button>
          </div>
          {!!error && <div style={DiscoverQuizzesStyle.error}>{error}</div>}
        </div>

        {hasResults ? (
          <div style={DiscoverQuizzesStyle.grid}>
            {results.map((quiz) => (
              <DiscoverQuizCard key={quiz.id} quiz={quiz} onOpenQuiz={onOpenQuiz} />
            ))}
          </div>
        ) : (
          <div style={DiscoverQuizzesStyle.empty}>
            <div style={DiscoverQuizzesStyle.emptyTitle}>{STRINGS.DISCOVER_QUIZZES.empty.title}</div>
            <div style={DiscoverQuizzesStyle.emptyText}>
              {busy ? STRINGS.DISCOVER_QUIZZES.empty.loading : STRINGS.DISCOVER_QUIZZES.empty.noQuizzes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
