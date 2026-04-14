import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

type SessionOption = {
  id: string;
  label: string;
  text: string;
};

type SessionQuestion = {
  question_text: string;
  mode?: string | null;
  options?: SessionOption[];
};

type AnswerResult = {
  skipped?: boolean;
  is_correct?: boolean;
  correct_option_id?: string | null;
  chosen_option_id?: string | null;
  next_question_available?: boolean;
};

type Props = {
  question: SessionQuestion;
  busy: boolean;
  answerResult: AnswerResult | null;
  lifelinesUsed: string[];
  audiencePoll: Record<string, number> | null;
  phoneMessage: string;
  phoneSuggestionOptionId: string | null;
  pendingChoiceId: string | null;
  disabledOptionIds: string[];
  speedBonus: number;
  onSubmit: (optionId: string) => void;
  onTriggerLifeline: (type: string) => void;
  onLoadCurrent: () => void;
  onFinish: () => void;
};

/**
 * Default session question view: renders question/options and lifelines for supported modes.
 * @param question Current session question.
 * @param answerResult Server result used to reveal correct/wrong state.
 * @returns React element.
 */
export default function PlaySessionDefaultQuestionView({
  question,
  busy,
  answerResult,
  lifelinesUsed,
  audiencePoll,
  phoneMessage,
  phoneSuggestionOptionId,
  pendingChoiceId,
  disabledOptionIds,
  speedBonus,
  onSubmit,
  onTriggerLifeline,
  onLoadCurrent,
  onFinish,
}: Props) {
  return (
      <div className="tv-card" style={PlaySessionStyle.card as any}>
      <div style={PlaySessionStyle.qText as any}>{question.question_text}</div>

      {question.mode === 'millionaire' ? (
        <div style={PlaySessionStyle.pillsCentered as any}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn as any}
            disabled={busy || !!answerResult || lifelinesUsed.includes('fifty_fifty')}
            onClick={() => onTriggerLifeline('fifty_fifty')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelineFiftyShort}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn as any}
            disabled={busy || !!answerResult || lifelinesUsed.includes('phone')}
            onClick={() => onTriggerLifeline('phone')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelinePhone}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn as any}
            disabled={busy || !!answerResult || lifelinesUsed.includes('audience')}
            onClick={() => onTriggerLifeline('audience')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelineAudience}
          </button>
        </div>
      ) : null}

      {question.mode === 'millionaire' && audiencePoll ? (
        <div style={PlaySessionStyle.audiencePollCard as any}>
          {STRINGS.PLAY_SESSION.millionaire.audiencePollLabel}:{' '}
          {(question.options || [])
            .map((o) => ({ label: o.label, pct: Number(audiencePoll?.[o.id]) || 0 }))
            .sort((a, b) => b.pct - a.pct)
            .map((x) => `${x.label}:${x.pct}%`)
            .join('  ')}
        </div>
      ) : null}

      {question.mode === 'millionaire' && phoneMessage ? (
        <div style={PlaySessionStyle.phoneHintCard as any}>
          {ICONS.common.phone} {phoneMessage}
        </div>
      ) : null}

      <div style={PlaySessionStyle.options as any}>
        {(question.options || []).map((o) => {
          const disabled = busy || !!answerResult;
          const suggested = phoneSuggestionOptionId === o.id;
          const selected = pendingChoiceId === o.id;
          const reveal = !!answerResult && !answerResult?.skipped;
          const correctOptionId = reveal ? answerResult?.correct_option_id : null;
          const chosenOptionId =
            reveal ? answerResult?.chosen_option_id ?? pendingChoiceId : pendingChoiceId;

          const isCorrect = reveal && correctOptionId != null && String(o.id) === String(correctOptionId);
          const isChosen = reveal && chosenOptionId != null && String(o.id) === String(chosenOptionId);
          const isWrongChosen = reveal && isChosen && !isCorrect;

          const state = reveal
            ? isCorrect
              ? 'correct'
              : isWrongChosen
                ? 'wrong'
                : 'dim'
            : 'idle';

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
              style={PlaySessionStyle.optionBtnState({
                active: suggested || selected,
                state,
                disabled: disabled || disabledOptionIds.includes(o.id),
              }) as any}
              disabled={disabled || disabledOptionIds.includes(o.id)}
              onClick={() => onSubmit(o.id)}
            >
              <span style={PlaySessionStyle.optionLabel as any}>{o.label}</span>
              <span style={PlaySessionStyle.optionText as any}>{o.text}</span>
              {!!resultIcon && <span style={PlaySessionStyle.optionResultIcon as any}>{resultIcon}</span>}
            </button>
          );
        })}
      </div>

      {!!answerResult && (
        <div style={PlaySessionStyle.resultState(answerResult.is_correct) as any}>
          {answerResult.skipped
            ? STRINGS.PLAY_SESSION.results.skipped
            : answerResult.is_correct
              ? STRINGS.PLAY_SESSION.results.correctShort
              : STRINGS.PLAY_SESSION.results.wrongShort}
          {!!speedBonus && answerResult.is_correct && (
            <span style={PlaySessionStyle.bonus as any}>
              {' '}
              {STRINGS.PLAY_SESSION.results.bonusSpeed(speedBonus)}
            </span>
          )}
        </div>
      )}

      <div style={PlaySessionStyle.actions as any}>
        {answerResult ? (
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.primaryBtnMain as any}
            disabled={busy}
            onClick={answerResult.next_question_available ? onLoadCurrent : onFinish}
          >
            {answerResult.next_question_available
              ? STRINGS.PLAY_SESSION.results.next
              : STRINGS.PLAY_SESSION.results.finish}
          </button>
        ) : null}

        <button
          type="button"
          className="tv-card tv-card--hover"
          style={PlaySessionStyle.secondaryBtnWhite as any}
          disabled={busy}
          onClick={onLoadCurrent}
          title={STRINGS.PLAY_SESSION.actions.reloadTitle}
        >
          {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
        </button>
      </div>
    </div>
  );
}

