import React from 'react';
import DiscoverQuizzesStyle from '@/Styles/ComponentStyles/DiscoverQuizzesStyle';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import type { DiscoverQuiz, OpenQuizHandler } from '@/features/DiscoverQuizzes/types';

type DiscoverQuizCardProps = {
  quiz: DiscoverQuiz;
  onOpenQuiz?: OpenQuizHandler;
};

function formatRating(
  avg: number | string | null | undefined,
  count: number | string | null | undefined
) {
  const a = Number(avg);
  const c = Number(count);
  const avgText = Number.isFinite(a) ? a.toFixed(a % 1 === 0 ? 0 : 1) : '0';
  const countText = Number.isFinite(c) ? c : 0;
  return `${ICONS.common.star} ${avgText} (${countText})`;
}

export default function DiscoverQuizCard({ quiz, onOpenQuiz }: DiscoverQuizCardProps) {
  return (
    <button
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

      {!!quiz.description && <div style={DiscoverQuizzesStyle.desc}>{quiz.description}</div>}

      <div style={DiscoverQuizzesStyle.openHint}>{STRINGS.DISCOVER_QUIZZES.openHint}</div>
    </button>
  );
}
