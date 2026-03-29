import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

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
}) {
  if (!finished && !isStory) {
    return (
      <div style={PlaySessionStyle.topRow}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={PlaySessionStyle.secondaryBtnWhite}
          onClick={onBack}
          disabled={busy}
        >
          {STRINGS.COMMON.symbols.leftArrow} {backLabel}
        </button>

        <div style={PlaySessionStyle.pills}>
          <span style={PlaySessionStyle.pill}>
            {ICONS.common.target} {title}
          </span>
          {timeInfo && <span style={PlaySessionStyle.pill}>{timeInfo}</span>}
          <span style={PlaySessionStyle.pill}>
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
      <div style={PlaySessionStyle.storyTop}>
        <div style={PlaySessionStyle.storyTopRow}>
          <div style={PlaySessionStyle.storyCount}>
            {STRINGS.PLAY_SESSION.header.questionOf(
              question.question_number,
              question.total_questions
            )}
          </div>

          <div style={PlaySessionStyle.storyDots} aria-label={STRINGS.PLAY_SESSION.aria.progressDots}>
            {Array.from({ length: storyDots }).map((_, i) => (
              <span key={i} style={PlaySessionStyle.storyDotItem(i === storyDotActiveIndex)} />
            ))}
          </div>
        </div>

        <div style={PlaySessionStyle.storyTrack} aria-label={STRINGS.PLAY_SESSION.aria.progressBar}>
          <div style={PlaySessionStyle.storyFillWidth(storyProgressPct)} />
        </div>
      </div>
    );
  }

  return null;
}
