import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

export default function PlaySessionMillionaireView({
  question,
  busy,
  answerResult,
  disabledOptionIds,
  phoneSuggestionOptionId,
  phoneMessage,
  audiencePoll,
  lifelinesUsed,
  prizeLadder,
  scoreTotal,
  onSubmit,
  onTriggerLifeline,
  onWalkAway,
  formatMoney,
  pendingChoiceId,
}) {
  return (
    <div style={PlaySessionStyle.millionaireShell}>
      <div style={PlaySessionStyle.millionaireTopBar}>
        <button
          type="button"
          className="tv-card tv-card--hover"
          style={PlaySessionStyle.millionaireExitBtn}
          onClick={onWalkAway}
          disabled={busy}
        >
          {STRINGS.COMMON.symbols.leftArrow} {STRINGS.PLAY_SESSION.millionaire.exit}
        </button>

        <div
          className={answerResult?.is_correct ? 'tv-mil-prize tv-mil-prize--bump' : 'tv-mil-prize'}
          style={PlaySessionStyle.millionairePrizePill}
        >
          {ICONS.common.crownGold} {formatMoney(scoreTotal)}
        </div>
      </div>

      <div style={PlaySessionStyle.millionaireGrid}>
        <div style={PlaySessionStyle.millionaireLeftCol}>
          <div style={PlaySessionStyle.millionaireCard}>
            <div style={PlaySessionStyle.millionaireCount}>
              {STRINGS.PLAY_SESSION.header.questionOf(
                question.question_number,
                question.total_questions
              )}
            </div>
            <div style={PlaySessionStyle.millionaireQuestion}>{question.question_text}</div>

            {!!phoneMessage && (
              <div style={PlaySessionStyle.millionaireHint}>
                {ICONS.common.phone} {phoneMessage}
              </div>
            )}

            <div style={PlaySessionStyle.millionaireOptions}>
              {(question.options || []).slice(0, 4).map((o) => {
                const disabled = busy || !!answerResult || disabledOptionIds.includes(o.id);
                const suggested = phoneSuggestionOptionId === o.id;
                const selected = pendingChoiceId === o.id;
                const celebrate = !!answerResult?.is_correct && pendingChoiceId === o.id;

                return (
                  <button
                    key={o.id}
                    type="button"
                    className={
                      celebrate
                        ? 'tv-card tv-card--hover tv-mil-option tv-mil-option--correct'
                        : 'tv-card tv-card--hover tv-mil-option'
                    }
                    style={{
                      ...PlaySessionStyle.millionaireOptionBtnState(suggested || selected, disabled),
                      ...(celebrate
                        ? {
                            boxShadow:
                              '0 22px 60px rgba(34,197,94,0.22), 0 18px 44px rgba(0,0,0,0.16)',
                            background: 'rgba(34,197,94,0.18)',
                            border: '1px solid rgba(34,197,94,0.48)',
                            opacity: 1,
                          }
                        : {}),
                    }}
                    disabled={disabled}
                    onClick={() => onSubmit(o.id)}
                  >
                    {celebrate && (
                      <span className="tv-mil-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                    <span style={PlaySessionStyle.millionaireOptionLabel}>{o.label}</span>
                    <span style={PlaySessionStyle.millionaireOptionText}>{o.text}</span>
                  </button>
                );
              })}
            </div>

            {!!answerResult && (
              <div style={PlaySessionStyle.resultState(answerResult.is_correct)}>
                {answerResult.is_correct
                  ? STRINGS.PLAY_SESSION.results.correct
                  : STRINGS.PLAY_SESSION.results.wrong}
              </div>
            )}
          </div>

          <div style={PlaySessionStyle.millionaireLifelinesCard}>
            <div style={PlaySessionStyle.millionaireLifelinesTitle}>
              {STRINGS.PLAY_SESSION.millionaire.lifelines}
            </div>
            <div style={PlaySessionStyle.millionaireLifelinesRow}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={PlaySessionStyle.millionaireLifelineBtn}
                disabled={busy || !!answerResult || lifelinesUsed.includes('fifty_fifty')}
                onClick={() => onTriggerLifeline('fifty_fifty')}
              >
                <div style={PlaySessionStyle.millionaireLifelineIcon}>½</div>
                <div style={PlaySessionStyle.millionaireLifelineText}>
                  {STRINGS.PLAY_SESSION.millionaire.lifelineFifty}
                </div>
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={PlaySessionStyle.millionaireLifelineBtn}
                disabled={busy || !!answerResult || lifelinesUsed.includes('phone')}
                onClick={() => onTriggerLifeline('phone')}
              >
                <div style={PlaySessionStyle.millionaireLifelineIcon}>{ICONS.common.phone}</div>
                <div style={PlaySessionStyle.millionaireLifelineText}>
                  {STRINGS.PLAY_SESSION.millionaire.lifelinePhone}
                </div>
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={PlaySessionStyle.millionaireLifelineBtn}
                disabled={busy || !!answerResult || lifelinesUsed.includes('audience')}
                onClick={() => onTriggerLifeline('audience')}
              >
                <div style={PlaySessionStyle.millionaireLifelineIcon}>{ICONS.common.people}</div>
                <div style={PlaySessionStyle.millionaireLifelineText}>
                  {STRINGS.PLAY_SESSION.millionaire.lifelineAudience}
                </div>
              </button>
            </div>

            {audiencePoll ? (
              <div style={PlaySessionStyle.millionaireHint}>
                {ICONS.common.people} {STRINGS.PLAY_SESSION.millionaire.audienceLabel}:{' '}
                {(question.options || [])
                  .map((o) => ({ label: o.label, pct: Number(audiencePoll?.[o.id]) || 0 }))
                  .sort((a, b) => b.pct - a.pct)
                  .map((x) => `${x.label}:${x.pct}%`)
                  .join('  ')}
              </div>
            ) : null}
          </div>
        </div>

        <div style={PlaySessionStyle.millionaireLadderCard}>
          <div style={PlaySessionStyle.millionaireLadderTitle}>
            {STRINGS.PLAY_SESSION.millionaire.prizeLadder}
          </div>
          <div style={PlaySessionStyle.millionaireLadderList}>
            {prizeLadder.map((row) => {
              const active = Number(question.question_number) === row.index;
              return (
                <div key={row.index} style={PlaySessionStyle.millionaireLadderRowState(active)}>
                  <span style={PlaySessionStyle.millionaireLadderNum}>{row.index}</span>
                  <span style={PlaySessionStyle.millionaireLadderValue}>{formatMoney(row.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
