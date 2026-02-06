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

export default function PlaySession({ sessionId, user, onRequireAuth, onBack }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);

  const questionStartRef = useRef(Date.now());

  const loadCurrent = async () => {
    setBusy(true);
    setError('');
    try {
      const q = await api.getCurrentQuestion(sessionId);
      setQuestion(q);
      setAnswerResult(null);
      setSpeedBonus(0);
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
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, !!user]);

  const title = useMemo(() => {
    if (!question) return 'Custom Quiz';
    const a = Number(question.question_number);
    const b = Number(question.total_questions);
    if (Number.isFinite(a) && Number.isFinite(b)) return `Question ${a} / ${b}`;
    return 'Question';
  }, [question]);

  const timeInfo = useMemo(() => {
    if (!question) return null;
    if (Number.isFinite(Number(question.time_remaining_sec))) {
      return `⏱ ${question.time_remaining_sec}s left`;
    }
    if (Number.isFinite(Number(question.time_limit_sec))) {
      return `⏱ ${question.time_limit_sec}s`;
    }
    return null;
  }, [question]);

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
      if (Number.isFinite(Number(result.score_total))) setScoreTotal(result.score_total);
      if (Number.isFinite(Number(result.speed_bonus))) setSpeedBonus(result.speed_bonus);

      if (!result.next_question_available) {
        window.setTimeout(() => {
          finish();
        }, 500);
        return;
      }

      window.setTimeout(() => {
        loadCurrent();
      }, 350);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
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

  if (!user) {
    return (
      <div style={PlaySessionStyle.page}>
        <div style={PlaySessionStyle.container}>
          <div className="tv-card" style={PlaySessionStyle.lockCard}>
            <h2 style={PlaySessionStyle.lockTitle}>Login to play</h2>
            <p style={PlaySessionStyle.lockText}>
              You need an account to play custom quizzes and save scores.
            </p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.primaryBtn, background: colors.gradients.main }}
              onClick={() => onRequireAuth?.('play')}
            >
              Join / Login 🚀
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
      <div style={PlaySessionStyle.container}>
        <div style={PlaySessionStyle.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={{ ...PlaySessionStyle.secondaryBtn, background: colors.neutral.white }}
            onClick={onBack}
            disabled={busy}
          >
            ← Back
          </button>

          <div style={PlaySessionStyle.pills}>
            <span style={PlaySessionStyle.pill}>🎯 {title}</span>
            {timeInfo && <span style={PlaySessionStyle.pill}>{timeInfo}</span>}
            <span style={PlaySessionStyle.pill}>🏅 Score: {scoreTotal}</span>
          </div>
        </div>

        {!!error && (
          <div className="tv-card" style={PlaySessionStyle.errorCard}>
            {error}
          </div>
        )}

        {finished && !question ? (
          <div className="tv-card" style={PlaySessionStyle.doneCard}>
            <h2 style={PlaySessionStyle.doneTitle}>Nice run! 🎉</h2>
            <p style={PlaySessionStyle.doneText}>Final score: {scoreTotal}</p>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={{ ...PlaySessionStyle.primaryBtn, background: colors.gradients.main }}
              onClick={onBack}
            >
              Back to quizzes
            </button>
          </div>
        ) : !question ? (
          <div style={PlaySessionStyle.loading}>{busy ? 'Loading…' : 'No question'}</div>
        ) : (
          <div className="tv-card" style={PlaySessionStyle.card}>
            <div style={PlaySessionStyle.qText}>{question.question_text}</div>

            <div style={PlaySessionStyle.options}>
              {(question.options || []).map((o) => {
                const disabled = busy || !!answerResult;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="tv-card tv-card--hover"
                    style={{
                      ...PlaySessionStyle.optionBtn,
                    }}
                    disabled={disabled}
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
                {answerResult.is_correct ? 'Correct ✅' : 'Wrong ❌'}
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
                  {answerResult.next_question_available ? 'Next →' : 'Finish 🏁'}
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
                Refresh ↻
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
