import React from 'react';
import { ICONS } from '@/constants/icons';
import DuelPlayStyle from '@/Styles/ComponentStyles/DuelPlayStyle';
import type { DuelAnswer, DuelQuestion } from '@/features/DuelPlay/types';

type DuelQuestionOptionsProps = {
  question: DuelQuestion;
  myAnswer: DuelAnswer | null;
  myAnswered: boolean;
  selectedOptionId: string | null;
  busy: boolean;
  msUntilStart: number;
  isCompleted: boolean;
  onAnswer: (...args: [string]) => void;
};

/**
 * Render duel answer options with reveal styling after submission.
 * @param question Current duel question with options.
 * @param myAnswer Current player's submitted answer (if any).
 * @returns React element.
 */
export default function DuelQuestionOptions({
  question,
  myAnswer,
  myAnswered,
  selectedOptionId,
  busy,
  msUntilStart,
  isCompleted,
  onAnswer,
}: DuelQuestionOptionsProps) {
  return (
    <div style={DuelPlayStyle.options}>
      {(question?.options || []).map((o) => {
        const disabled = busy || myAnswered || msUntilStart > 0 || isCompleted;
        const selected = selectedOptionId === o.id;
        const reveal = !!myAnswer;
        const chosenId = myAnswer?.session_option_id ?? selectedOptionId;
        const isChosen = chosenId != null && String(o.id) === String(chosenId);
        const isCorrectOption =
          question?.correct_option_id != null &&
          String(o.id) === String(question.correct_option_id);
        const isCorrectChosen = reveal && isChosen && myAnswer?.is_correct === true;
        const isWrongChosen = reveal && isChosen && myAnswer?.is_correct === false;

        const base = DuelPlayStyle.optionBtnState(selected, disabled);
        const revealStyle = reveal
          ? isCorrectChosen
            ? {
                background:
                  'linear-gradient(90deg, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0.08) 100%)',
                border: '1px solid rgba(34,197,94,0.45)',
              }
            : isWrongChosen
              ? {
                  background:
                    'linear-gradient(90deg, rgba(239,68,68,0.16) 0%, rgba(239,68,68,0.08) 100%)',
                  border: '1px solid rgba(239,68,68,0.45)',
                }
              : isCorrectOption
                ? {
                    background:
                      'linear-gradient(90deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.06) 100%)',
                    border: '1px solid rgba(34,197,94,0.28)',
                  }
                : {
                    opacity: 0.72,
                    filter: 'saturate(0.85) brightness(1.02)',
                  }
          : null;

        const resultIcon = reveal
          ? isCorrectChosen
            ? ICONS.common.tick
            : isWrongChosen
              ? ICONS.common.close
              : isCorrectOption
                ? ICONS.common.tick
                : null
          : null;

        return (
          <button
            key={o.id}
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...base, ...(revealStyle || {}) }}
            disabled={disabled}
            onClick={() => onAnswer(o.id)}
          >
            <span style={DuelPlayStyle.optionLabel}>{o.label}</span>
            <span style={DuelPlayStyle.optionText}>{o.text}</span>
            {!!resultIcon && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 18,
                  fontWeight: 950,
                }}
                aria-hidden="true"
              >
                {resultIcon}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
