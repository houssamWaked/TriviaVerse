import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle, { getStoryOptionTheme } from '@/Styles/ComponentStyles/PlaySessionStyle';

type SessionOption = {
  id: string;
  text: string;
};

type SessionQuestion = {
  question_text: string;
  options?: SessionOption[];
};

type AnswerResult = {
  skipped?: boolean;
  is_correct?: boolean;
  correct_option_id?: string | null;
  chosen_option_id?: string | null;
};

type Props = {
  question: SessionQuestion;
  busy: boolean;
  answerResult: AnswerResult | null;
  pendingChoiceId: string | null;
  correctCount: number;
  accuracyPct: number;
  storyEmoji: string;
  onSubmit: (optionId: string) => void;
};

export default function PlaySessionStoryView({
  question,
  busy,
  answerResult,
  pendingChoiceId,
  correctCount,
  accuracyPct,
  storyEmoji,
  onSubmit,
}: Props) {
  return (
    <>
      <div className="tv-card" style={PlaySessionStyle.storyCard as any}>
        <div style={PlaySessionStyle.storyEmoji as any} aria-label={STRINGS.PLAY_SESSION.aria.mood}>
          {storyEmoji}
        </div>

        <div style={PlaySessionStyle.storyQuestion as any}>{question.question_text}</div>

        <div style={PlaySessionStyle.storyOptions as any}>
          {(question.options || []).slice(0, 4).map((o, idx) => {
            const disabled = busy || !!answerResult;
            const theme = getStoryOptionTheme(idx);
            const selected = pendingChoiceId === o.id;
            const reveal = !!answerResult && !answerResult?.skipped;
            const correctOptionId = reveal ? answerResult?.correct_option_id : null;
            const chosenOptionId =
              reveal ? answerResult?.chosen_option_id ?? pendingChoiceId : pendingChoiceId;

            const isCorrect =
              reveal && correctOptionId != null && String(o.id) === String(correctOptionId);
            const isChosen =
              reveal && chosenOptionId != null && String(o.id) === String(chosenOptionId);
            const isWrongChosen = reveal && isChosen && !isCorrect;

            const bg = isCorrect
              ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
              : isWrongChosen
                ? 'linear-gradient(90deg, #fb7185 0%, #ff2d55 100%)'
                : theme.bg;

            const dim = reveal && !isCorrect && !isWrongChosen;
            const resultIcon = reveal
              ? isCorrect
                ? ICONS.common.tick
                : isWrongChosen
                  ? ICONS.common.close
                  : null
              : null;

            return (
              <button
                key={o.id}
                type="button"
                className={`tv-card ${answerResult ? '' : 'tv-card--hover'}`}
                style={
                  {
                    ...PlaySessionStyle.storyOptionBtnState(selected),
                    ...(dim ? { opacity: 0.72, filter: 'saturate(0.75) brightness(1.06)' } : {}),
                  } as any
                }
                disabled={disabled}
                onClick={() => onSubmit(o.id)}
              >
                <div style={PlaySessionStyle.storyOptionInnerBg(bg) as any}>
                  <div style={PlaySessionStyle.storyShape as any}>{theme.shape}</div>
                  <div style={PlaySessionStyle.storyOptionText as any}>{o.text}</div>
                  {!!resultIcon && <div style={PlaySessionStyle.storyResultIcon as any}>{resultIcon}</div>}
                </div>
              </button>
            );
          })}
        </div>

        {!!answerResult && (
          <div style={PlaySessionStyle.storyToastState(answerResult.is_correct) as any}>
            {answerResult.is_correct
              ? STRINGS.PLAY_SESSION.results.correctShort
              : STRINGS.PLAY_SESSION.results.wrongShort}
          </div>
        )}
      </div>

      <div style={PlaySessionStyle.storyBottom as any}>
        <div style={PlaySessionStyle.storyBottomPill as any}>{correctCount} Correct!</div>
        <div style={PlaySessionStyle.storyBottomPill as any}>
          {ICONS.common.bolt} {accuracyPct}%
        </div>
      </div>
    </>
  );
}
