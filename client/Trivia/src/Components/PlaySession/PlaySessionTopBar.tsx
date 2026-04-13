import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

type SessionQuestion = {
  mode?: string | null;
  question_number: number;
  total_questions: number;
};

type Props = {
  finished: boolean;
  isStory: boolean;
  question: SessionQuestion | null;
  busy: boolean;
  onBack: () => void;
  backLabel: string;
  title: string;
  timeInfo: string;
  scoreTotal: number | string;
  storyDots: number;
  storyDotActiveIndex: number;
  storyProgressPct: number;
};

/**
 * Session header UI: renders either the standard top row or the story-style progress header.
 * @param finished Whether the session is finished.
 * @param isStory Whether this session is in story variant.
 * @returns React element or null.
 */
export default function PlaySessionTopBar({
  finished,
  isStory,
  question,
  busy,
  onBack,
  backLabel,
  title,
  timeInfo,
  scoreTotal,
  storyDots,
  storyDotActiveIndex,
  storyProgressPct,
}: Props) {
  if (!finished && !isStory) {
    return (
      <div style={PlaySessionStyle.topRow as any}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={PlaySessionStyle.secondaryBtnWhite as any}
          onClick={onBack}
          disabled={busy}
        >
          {STRINGS.COMMON.symbols.leftArrow} {backLabel}
        </button>

        <div style={PlaySessionStyle.pills as any}>
          <span style={PlaySessionStyle.pill as any}>
            {ICONS.common.target} {title}
          </span>
          {timeInfo && <span style={PlaySessionStyle.pill as any}>{timeInfo}</span>}
          <span style={PlaySessionStyle.pill as any}>
            {question?.mode === 'millionaire'
              ? `${ICONS.common.money} ${STRINGS.PLAY_SESSION.header.prizeLabel}`
              : `${ICONS.common.trophy} ${STRINGS.PLAY_SESSION.header.scoreLabel}`}
            : {scoreTotal}
          </span>
        </div>
      </div>
    );
  }

  if (!finished && question) {
    return (
      <div style={PlaySessionStyle.storyTop as any}>
        <div style={PlaySessionStyle.storyTopRow as any}>
          <div style={PlaySessionStyle.storyCount as any}>
            {STRINGS.PLAY_SESSION.header.questionOf(
              question.question_number,
              question.total_questions
            )}
          </div>

          <div style={PlaySessionStyle.storyDots as any} aria-label={STRINGS.PLAY_SESSION.aria.progressDots}>
            {Array.from({ length: storyDots }).map((_, i) => (
              <span key={i} style={PlaySessionStyle.storyDotItem(i === storyDotActiveIndex) as any} />
            ))}
          </div>
        </div>

        <div style={PlaySessionStyle.storyTrack as any} aria-label={STRINGS.PLAY_SESSION.aria.progressBar}>
          <div style={PlaySessionStyle.storyFillWidth(storyProgressPct) as any} />
        </div>
      </div>
    );
  }

  return null;
}

