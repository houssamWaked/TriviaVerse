import React, { useEffect, useMemo, useRef, useState } from 'react';
import colors from '../constants/colors';
import { api } from '../api';
import PlaySessionStyle from '../Styles/ComponentStyles/PlaySessionStyle';

function getApiErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

function isUnauthorized(err) {
  return Number(err?.response?.status) === 401;
}

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function formatMoney(n) {
  const value = Math.max(0, Number(n) || 0);
  return `€${value.toLocaleString()}`;
}

export default function PlaySession({
  sessionId,
  user,
  onRequireAuth,
  onBack,
  backLabel = 'Back',
  variant = 'default', // 'default' | 'story'
}) {
  const isStory = variant === 'story';
  const [sessionMode, setSessionMode] = useState('');

  const [disabledOptionIds, setDisabledOptionIds] = useState([]);
  const [audiencePoll, setAudiencePoll] = useState(null);
  const [phoneSuggestionOptionId, setPhoneSuggestionOptionId] = useState(null);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [lifelinesUsed, setLifelinesUsed] = useState([]);
  const [blitzRemaining, setBlitzRemaining] = useState(null);
  const timeUpRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const questionStartRef = useRef(Date.now());

  const loadCurrent = async () => {
    setBusy(true);
    setError('');
    try {
      const q = await api.getCurrentQuestion(sessionId);
      setQuestion(q);
      setSessionMode(q?.mode || '');
      setAnswerResult(null);
      setSpeedBonus(0);
      setDisabledOptionIds(Array.isArray(q?.disabled_option_ids) ? q.disabled_option_ids : []);
      setAudiencePoll(q?.audience_poll || null);
      setPhoneSuggestionOptionId(q?.phone_suggestion_option_id || null);
      setPhoneMessage(q?.phone_message || '');
      setLifelinesUsed(Array.isArray(q?.lifelines_used) ? q.lifelines_used : []);
      if (Number.isFinite(Number(q?.time_remaining_sec))) {
        setBlitzRemaining(Number(q.time_remaining_sec));
      } else {
        setBlitzRemaining(null);
      }
      timeUpRef.current = false;
      questionStartRef.current = Date.now();
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setFinished(false);
    setScoreTotal(0);
    setAnsweredCount(0);
    setCorrectCount(0);
    setSessionMode('');
    setDisabledOptionIds([]);
    setAudiencePoll(null);
    setPhoneSuggestionOptionId(null);
    setPhoneMessage('');
    setLifelinesUsed([]);
    setBlitzRemaining(null);
    timeUpRef.current = false;
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, !!user]);

  useEffect(() => {
    if (!Number.isFinite(Number(blitzRemaining))) return undefined;
    if (finished) return undefined;
    if (busy) return undefined;
    if (Number(blitzRemaining) <= 0) return undefined;

    const t = window.setInterval(() => {
      setBlitzRemaining((v) => {
        if (!Number.isFinite(Number(v))) return v;
        return Math.max(0, Number(v) - 1);
      });
    }, 1000);

    return () => window.clearInterval(t);
  }, [blitzRemaining, finished, busy]);

  useEffect(() => {
    if (!Number.isFinite(Number(blitzRemaining))) return;
    if (finished) return;
    if (timeUpRef.current) return;
    if (Number(blitzRemaining) > 0) return;

    timeUpRef.current = true;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blitzRemaining, finished]);

  const title = useMemo(() => {
    if (!question) return 'Question';
    const a = Number(question.question_number);
    const b = Number(question.total_questions);
    if (Number.isFinite(a) && Number.isFinite(b)) return `Question ${a} / ${b}`;
    return 'Question';
  }, [question]);

  const timeInfo = useMemo(() => {
    if (!question) return null;
    if (Number.isFinite(Number(blitzRemaining))) {
      return `â± ${blitzRemaining}s left`;
    }
    if (Number.isFinite(Number(question.time_limit_sec))) {
      return `â± ${question.time_limit_sec}s`;
    }
    return null;
  }, [question, blitzRemaining]);

  const prizeLadder = useMemo(() => {
    const list = Array.isArray(question?.prizes) ? question.prizes : [];
    return list
      .map((p, idx) => ({ index: idx + 1, value: Number(p) || 0 }))
      .slice(0, 15)
      .reverse();
  }, [question?.prizes]);

  const storyProgressPct = useMemo(() => {
    const a = Number(question?.question_number);
    const b = Number(question?.total_questions);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
    return clampPct(Math.round((a / b) * 100));
  }, [question?.question_number, question?.total_questions]);

  const storyDots = useMemo(() => {
    const total = Math.max(1, Number(question?.total_questions) || 1);
    return Math.min(6, total);
  }, [question?.total_questions]);

  const storyDotActiveCount = useMemo(() => {
    const qNum = Math.max(1, Number(question?.question_number) || 1);
    const total = Math.max(1, Number(question?.total_questions) || 1);
    const dots = Math.max(1, storyDots);
    return Math.max(1, Math.min(dots, Math.ceil((qNum / total) * dots)));
  }, [question?.question_number, question?.total_questions, storyDots]);

  const accuracyPct = useMemo(() => {
    if (!answeredCount) return 0;
    return clampPct(Math.round((correctCount / answeredCount) * 100));
  }, [answeredCount, correctCount]);

  const storyEmoji = useMemo(() => {
    if (!answerResult) return 'ðŸ¤”';
    return answerResult.is_correct ? 'ðŸŽ‰' : 'ðŸ˜¬';
  }, [answerResult]);

  const storyOptionTheme = (index) => {
    if (index === 0)
      return {
        bg: `linear-gradient(90deg, ${colors.accent.red} 0%, #ff2d55 100%)`,
        shape: 'â–³',
      };
    if (index === 1)
      return {
        bg: `linear-gradient(90deg, ${colors.accent.blue} 0%, #2563eb 100%)`,
        shape: 'â—‡',
      };
    if (index === 2)
      return {
        bg: `linear-gradient(90deg, ${colors.accent.yellow} 0%, #f59e0b 100%)`,
        shape: 'â—‹',
      };
    return {
      bg: `linear-gradient(90deg, ${colors.accent.green} 0%, #16a34a 100%)`,
      shape: 'â–¡',
    };
  };

  const submit = async (chosenOptionId) => {
    if (!question || !chosenOptionId || busy || answerResult) return;
    setBusy(true);
    setError('');
    try {
      const answered_in_sec = Math.max(
        0,
        Math.floor((Date.now() - questionStartRef.current) / 1000)
      );
      const result = await api.submitAnswer(sessionId, {
        session_question_id: question.session_question_id,
        chosen_option_id: chosenOptionId,
        answered_in_sec,
      });

      setAnswerResult(result);
      setAnsweredCount((x) => x + 1);
      if (result.is_correct) setCorrectCount((x) => x + 1);
      if (Number.isFinite(Number(result.score_total))) setScoreTotal(result.score_total);
      if (Number.isFinite(Number(result.current_prize))) setScoreTotal(result.current_prize);
      if (Number.isFinite(Number(result.speed_bonus))) setSpeedBonus(result.speed_bonus);
      if (Number.isFinite(Number(result.time_remaining_sec))) {
        setBlitzRemaining(Number(result.time_remaining_sec));
      }

      if (!result.next_question_available) {
        window.setTimeout(() => {
          finish();
        }, isStory ? 700 : 500);
        return;
      }

      window.setTimeout(() => {
        loadCurrent();
      }, isStory ? 700 : 350);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      if (err?.response?.data?.code === 'TIME_UP') {
        finish();
        return;
      }
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await api.finishSession(sessionId, { status: 'completed' });
      setFinished(true);
      setQuestion(null);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const walkAway = async () => {
    setBusy(true);
    setError('');
    try {
      await api.finishSession(sessionId, { status: 'abandoned' });
      onBack?.();
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const triggerLifeline = async (lifeline_type) => {
    if (!question || busy || answerResult) return;
    if (!lifeline_type) return;
    if ((lifelinesUsed || []).includes(lifeline_type)) return;

    setBusy(true);
    setError('');
    try {
      const res = await api.useLifeline(sessionId, {
        lifeline_type,
        session_question_id: question.session_question_id,
      });
      setLifelinesUsed((prev) => Array.from(new Set([...(prev || []), lifeline_type])));

      if (res?.lifeline_type === 'fifty_fifty' && Array.isArray(res.disabled_option_ids)) {
        setDisabledOptionIds(res.disabled_option_ids);
      } else if (res?.lifeline_type === 'audience' && res?.audience_poll) {
        setAudiencePoll(res.audience_poll);
      } else if (res?.lifeline_type === 'phone') {
        setPhoneSuggestionOptionId(res.suggestion_option_id || null);
        setPhoneMessage(res.message || '');
      } else if (res?.lifeline_type === 'skip' && res?.skipped) {
        setAnswerResult({ is_correct: false, skipped: true, next_question_available: true });
        window.setTimeout(() => loadCurrent(), 250);
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div style={PlaySessionStyle.page}>
        <div style={PlaySessionStyle.container}>
          <div className="tv-card" style={PlaySessionStyle.lockCard}>
            <h2 style={PlaySessionStyle.lockTitle}>Login to play</h2>
            <p style={PlaySessionStyle.lockText}>
              You need an account to play sessions and save progress.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.primaryBtn, background: colors.gradients.main }}
              onClick={() => onRequireAuth?.('play')}
            >
              Join / Login ðŸš€
            </button>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.secondaryBtn, background: colors.neutral.white }}
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={PlaySessionStyle.page}>
      <div
        style={
          isStory
            ? { ...PlaySessionStyle.container, ...PlaySessionStyle.storyShell }
            : PlaySessionStyle.container
        }
      >
        {!isStory ? (
          <div style={PlaySessionStyle.topRow}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.secondaryBtn, background: colors.neutral.white }}
              onClick={onBack}
              disabled={busy}
            >
              â† Back
            </button>

            <div style={PlaySessionStyle.pills}>
              <span style={PlaySessionStyle.pill}>ðŸŽ¯ {title}</span>
              {timeInfo && <span style={PlaySessionStyle.pill}>{timeInfo}</span>}
              <span style={PlaySessionStyle.pill}>
                {question?.mode === 'millionaire' ? 'ðŸ’° Prize' : 'ðŸ† Score'}: {scoreTotal}
              </span>
            </div>
          </div>
        ) : question ? (
          <div style={PlaySessionStyle.storyTop}>
            <div style={PlaySessionStyle.storyTopRow}>
              <div style={PlaySessionStyle.storyCount}>
                Question {question.question_number} of {question.total_questions}
              </div>
              <div style={PlaySessionStyle.storyDots} aria-label="Progress dots">
                {Array.from({ length: storyDots }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      ...PlaySessionStyle.storyDot,
                      ...(i < storyDotActiveCount ? PlaySessionStyle.storyDotActive : null),
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={PlaySessionStyle.storyTrack} aria-label="Progress bar">
              <div style={{ ...PlaySessionStyle.storyFill, width: `${storyProgressPct}%` }} />
            </div>
          </div>
        ) : null}

        {!!error && (
          <div className="tv-card" style={PlaySessionStyle.errorCard}>
            {error}
          </div>
        )}

        {finished && !question ? (
          <div className="tv-card" style={PlaySessionStyle.doneCard}>
            <h2 style={PlaySessionStyle.doneTitle}>Nice run! ðŸŽ‰</h2>
            <p style={PlaySessionStyle.doneText}>
              {sessionMode === 'millionaire'
                ? `Final prize: ${formatMoney(scoreTotal)}`
                : `Final score: ${scoreTotal}`}
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.primaryBtn, background: colors.gradients.main }}
              onClick={onBack}
            >
              {backLabel}
            </button>
          </div>
        ) : !question ? (
          <div style={PlaySessionStyle.loading}>{busy ? 'Loadingâ€¦' : 'No question'}</div>
        ) : !isStory && question.mode === 'millionaire' ? (
          <div style={PlaySessionStyle.millionaireShell}>
            <div style={PlaySessionStyle.millionaireTopBar}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={PlaySessionStyle.millionaireExitBtn}
                onClick={walkAway}
                disabled={busy}
              >
                ← Exit
              </button>

              <div style={PlaySessionStyle.millionairePrizePill}>
                👑 {formatMoney(scoreTotal)}
              </div>
            </div>

            <div style={PlaySessionStyle.millionaireGrid}>
              <div style={PlaySessionStyle.millionaireLeftCol}>
                <div style={PlaySessionStyle.millionaireCard}>
                  <div style={PlaySessionStyle.millionaireCount}>
                    Question {question.question_number} of {question.total_questions}
                  </div>
                  <div style={PlaySessionStyle.millionaireQuestion}>
                    {question.question_text}
                  </div>

                  {!!phoneMessage && (
                    <div style={PlaySessionStyle.millionaireHint}>
                      📞 {phoneMessage}
                    </div>
                  )}

                  <div style={PlaySessionStyle.millionaireOptions}>
                    {(question.options || []).slice(0, 4).map((o) => {
                      const disabled = busy || !!answerResult || disabledOptionIds.includes(o.id);
                      const suggested = phoneSuggestionOptionId === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          className="tv-card tv-card--hover"
                          style={{
                            ...PlaySessionStyle.millionaireOptionBtn,
                            ...(suggested ? PlaySessionStyle.millionaireOptionSuggested : null),
                            ...(disabled ? PlaySessionStyle.millionaireOptionDisabled : null),
                          }}
                          disabled={disabled}
                          onClick={() => submit(o.id)}
                        >
                          <span style={PlaySessionStyle.millionaireOptionLabel}>
                            {o.label}
                          </span>
                          <span style={PlaySessionStyle.millionaireOptionText}>{o.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!!answerResult && (
                    <div
                      style={{
                        ...PlaySessionStyle.result,
                        ...(answerResult.is_correct
                          ? PlaySessionStyle.resultOk
                          : PlaySessionStyle.resultBad),
                      }}
                    >
                      {answerResult.is_correct ? 'Correct!' : 'Wrong!'}
                    </div>
                  )}
                </div>

                <div style={PlaySessionStyle.millionaireLifelinesCard}>
                  <div style={PlaySessionStyle.millionaireLifelinesTitle}>Lifelines</div>
                  <div style={PlaySessionStyle.millionaireLifelinesRow}>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.millionaireLifelineBtn}
                      disabled={busy || !!answerResult || lifelinesUsed.includes('fifty_fifty')}
                      onClick={() => triggerLifeline('fifty_fifty')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>½</div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>50:50</div>
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.millionaireLifelineBtn}
                      disabled={busy || !!answerResult || lifelinesUsed.includes('phone')}
                      onClick={() => triggerLifeline('phone')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>📞</div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>Phone</div>
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.millionaireLifelineBtn}
                      disabled={busy || !!answerResult || lifelinesUsed.includes('audience')}
                      onClick={() => triggerLifeline('audience')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>👥</div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>Audience</div>
                    </button>
                  </div>

                  {audiencePoll ? (
                    <div style={PlaySessionStyle.millionaireHint}>
                      👥 Audience:{' '}
                      {(question.options || [])
                        .map((o) => ({
                          label: o.label,
                          pct: Number(audiencePoll?.[o.id]) || 0,
                        }))
                        .sort((a, b) => b.pct - a.pct)
                        .map((x) => `${x.label}:${x.pct}%`)
                        .join('  ')}
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={PlaySessionStyle.millionaireLadderCard}>
                <div style={PlaySessionStyle.millionaireLadderTitle}>Prize Ladder</div>
                <div style={PlaySessionStyle.millionaireLadderList}>
                  {prizeLadder.map((row) => {
                    const active = Number(question.question_number) === row.index;
                    return (
                      <div
                        key={row.index}
                        style={{
                          ...PlaySessionStyle.millionaireLadderRow,
                          ...(active ? PlaySessionStyle.millionaireLadderRowActive : null),
                        }}
                      >
                        <span style={PlaySessionStyle.millionaireLadderNum}>{row.index}</span>
                        <span style={PlaySessionStyle.millionaireLadderValue}>
                          {formatMoney(row.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : !isStory ? (
          <div className="tv-card" style={PlaySessionStyle.card}>
            <div style={PlaySessionStyle.qText}>{question.question_text}</div>

            {question.mode === 'millionaire' ? (
              <div style={{ ...PlaySessionStyle.pills, marginTop: 12, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={busy || !!answerResult || lifelinesUsed.includes('fifty_fifty')}
                  onClick={() => triggerLifeline('fifty_fifty')}
                >
                  50/50
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={busy || !!answerResult || lifelinesUsed.includes('phone')}
                  onClick={() => triggerLifeline('phone')}
                >
                  Phone
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={busy || !!answerResult || lifelinesUsed.includes('audience')}
                  onClick={() => triggerLifeline('audience')}
                >
                  Audience
                </button>
              </div>
            ) : null}

            {question.mode === 'millionaire' && audiencePoll ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 16,
                  border: '1px solid rgba(139,44,255,0.22)',
                  background: 'rgba(139,44,255,0.08)',
                  fontSize: 13,
                  fontWeight: 900,
                  color: colors.primary[800],
                }}
              >
                Audience poll:{' '}
                {(question.options || [])
                  .map((o) => ({
                    label: o.label,
                    pct: Number(audiencePoll?.[o.id]) || 0,
                  }))
                  .sort((a, b) => b.pct - a.pct)
                  .map((x) => `${x.label}:${x.pct}%`)
                  .join('  ')}
              </div>
            ) : null}

            {question.mode === 'millionaire' && phoneMessage ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.24)',
                  background: 'rgba(255,255,255,0.14)',
                  fontSize: 13,
                  fontWeight: 900,
                  color: colors.neutral[900],
                }}
              >
                📞 {phoneMessage}
              </div>
            ) : null}

            <div style={PlaySessionStyle.options}>
              {(question.options || []).map((o) => {
                const disabled = busy || !!answerResult;
                const suggested = phoneSuggestionOptionId === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...PlaySessionStyle.optionBtn,
                      ...(suggested ? PlaySessionStyle.optionBtnActive : null),
                    }}
                    disabled={disabled || disabledOptionIds.includes(o.id)}
                    onClick={() => submit(o.id)}
                  >
                    <span style={PlaySessionStyle.optionLabel}>{o.label}</span>
                    <span style={PlaySessionStyle.optionText}>{o.text}</span>
                  </button>
                );
              })}
            </div>

            {!!answerResult && (
              <div
                style={{
                  ...PlaySessionStyle.result,
                  ...(answerResult.is_correct
                    ? PlaySessionStyle.resultOk
                    : PlaySessionStyle.resultBad),
                }}
              >
                {answerResult.skipped
                  ? 'Skipped âž¡'
                  : answerResult.is_correct
                    ? 'Correct âœ…'
                    : 'Wrong âŒ'}
                {!!speedBonus && answerResult.is_correct && (
                  <span style={PlaySessionStyle.bonus}> +{speedBonus} speed</span>
                )}
              </div>
            )}

            <div style={PlaySessionStyle.actions}>
              {answerResult ? (
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={{ ...PlaySessionStyle.primaryBtn, background: colors.gradients.main }}
                  disabled={busy}
                  onClick={answerResult.next_question_available ? loadCurrent : finish}
                >
                  {answerResult.next_question_available ? 'Next â†’' : 'Finish ðŸ'}
                </button>
              ) : null}

              <button
                type="button"
                className="tv-card tv-card--hover"
                style={{ ...PlaySessionStyle.secondaryBtn, background: colors.neutral.white }}
                disabled={busy}
                onClick={loadCurrent}
                title="Reload current question"
              >
                Refresh â†»
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="tv-card" style={PlaySessionStyle.storyCard}>
              <div style={PlaySessionStyle.storyEmoji} aria-label="Mood">
                {storyEmoji}
              </div>
              <div style={PlaySessionStyle.storyQuestion}>{question.question_text}</div>

              <div style={PlaySessionStyle.storyOptions}>
                {(question.options || []).slice(0, 4).map((o, idx) => {
                  const disabled = busy || !!answerResult;
                  const theme = storyOptionTheme(idx);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.storyOptionBtn}
                      disabled={disabled}
                      onClick={() => submit(o.id)}
                    >
                      <div
                        style={{
                          ...PlaySessionStyle.storyOptionInner,
                          background: theme.bg,
                        }}
                      >
                        <div style={PlaySessionStyle.storyShape}>{theme.shape}</div>
                        <div style={PlaySessionStyle.storyOptionText}>{o.text}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!!answerResult && (
                <div
                  style={{
                    ...PlaySessionStyle.storyToast,
                    ...(answerResult.is_correct
                      ? {
                          background: 'rgba(34,197,94,0.14)',
                          border: '1px solid rgba(34,197,94,0.30)',
                          color: colors.accent.green,
                        }
                      : {
                          background: 'rgba(239,68,68,0.14)',
                          border: '1px solid rgba(239,68,68,0.30)',
                          color: colors.accent.red,
                        }),
                  }}
                >
                  {answerResult.is_correct ? 'Correct âœ…' : 'Wrong âŒ'}
                </div>
              )}
            </div>

            <div style={PlaySessionStyle.storyBottom}>
              <div style={PlaySessionStyle.storyBottomPill}>ðŸ… {correctCount} Correct!</div>
              <div style={PlaySessionStyle.storyBottomPill}>âš¡ {accuracyPct}%</div>
              <div style={PlaySessionStyle.storyBottomPill}>ðŸ† {scoreTotal}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

