import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

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
}) {
  return (
    <div className="tv-card" style={PlaySessionStyle.card}>
      <div style={PlaySessionStyle.qText}>{question.question_text}</div>

      {question.mode === 'millionaire' ? (
        <div style={PlaySessionStyle.pillsCentered}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn}
            disabled={busy || !!answerResult || lifelinesUsed.includes('fifty_fifty')}
            onClick={() => onTriggerLifeline('fifty_fifty')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelineFiftyShort}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn}
            disabled={busy || !!answerResult || lifelinesUsed.includes('phone')}
            onClick={() => onTriggerLifeline('phone')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelinePhone}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.optionBtn}
            disabled={busy || !!answerResult || lifelinesUsed.includes('audience')}
            onClick={() => onTriggerLifeline('audience')}
          >
            {STRINGS.PLAY_SESSION.millionaire.lifelineAudience}
          </button>
        </div>
      ) : null}

      {question.mode === 'millionaire' && audiencePoll ? (
        <div style={PlaySessionStyle.audiencePollCard}>
          {STRINGS.PLAY_SESSION.millionaire.audiencePollLabel}:{' '}
          {(question.options || [])
            .map((o) => ({ label: o.label, pct: Number(audiencePoll?.[o.id]) || 0 }))
            .sort((a, b) => b.pct - a.pct)
            .map((x) => `${x.label}:${x.pct}%`)
            .join('  ')}
        </div>
      ) : null}

      {question.mode === 'millionaire' && phoneMessage ? (
        <div style={PlaySessionStyle.phoneHintCard}>
          {ICONS.common.phone} {phoneMessage}
        </div>
      ) : null}

      <div style={PlaySessionStyle.options}>
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
              })}
              disabled={disabled || disabledOptionIds.includes(o.id)}
              onClick={() => onSubmit(o.id)}
            >
              <span style={PlaySessionStyle.optionLabel}>{o.label}</span>
              <span style={PlaySessionStyle.optionText}>{o.text}</span>
              {!!resultIcon && <span style={PlaySessionStyle.optionResultIcon}>{resultIcon}</span>}
            </button>
          );
        })}
      </div>

      {!!answerResult && (
        <div style={PlaySessionStyle.resultState(answerResult.is_correct)}>
          {answerResult.skipped
            ? STRINGS.PLAY_SESSION.results.skipped
            : answerResult.is_correct
              ? STRINGS.PLAY_SESSION.results.correctShort
              : STRINGS.PLAY_SESSION.results.wrongShort}
          {!!speedBonus && answerResult.is_correct && (
            <span style={PlaySessionStyle.bonus}>
              {' '}
              {STRINGS.PLAY_SESSION.results.bonusSpeed(speedBonus)}
            </span>
          )}
        </div>
      )}

      <div style={PlaySessionStyle.actions}>
        {answerResult ? (
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={PlaySessionStyle.primaryBtnMain}
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
          style={PlaySessionStyle.secondaryBtnWhite}
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
