import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import PlaySessionStyle, {
  getStoryOptionTheme,
} from '@/Styles/ComponentStyles/PlaySessionStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import { saveGuestStoryResult } from '@/utils/guestStoryProgress';

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
  onNavigateHome,
  backLabel = STRINGS.COMMON.buttons.back,
  variant = 'default', // 'default' | 'story'
  storyLevelNumber = null,
}) {
  const isStory = variant === 'story';
  // Keep answer->next transitions snappy. Any intentional pause here is felt as lag.
  const nextTransitionMs = 1000;
  const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));
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
  const [pendingChoiceId, setPendingChoiceId] = useState(null);
  const [finished, setFinished] = useState(false);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [shareMessage, setShareMessage] = useState('');

  const questionStartRef = useRef(Date.now());
  const submitSeqRef = useRef(0);

  const applyQuestion = (q) => {
    const mode = q?.mode || '';
    setQuestion(q);
    setSessionMode(mode);
    setAnswerResult(null);
    setPendingChoiceId(null);
    setSpeedBonus(0);
    setDisabledOptionIds(
      Array.isArray(q?.disabled_option_ids) ? q.disabled_option_ids : []
    );
    setAudiencePoll(q?.audience_poll || null);
    setPhoneSuggestionOptionId(q?.phone_suggestion_option_id || null);
    setPhoneMessage(q?.phone_message || '');
    setLifelinesUsed(Array.isArray(q?.lifelines_used) ? q.lifelines_used : []);
    if ((mode === 'blitz' || mode === 'story') && Number.isFinite(Number(q?.time_remaining_sec))) {
      setBlitzRemaining(Number(q.time_remaining_sec));
    } else {
      setBlitzRemaining(null);
    }
    timeUpRef.current = false;
    questionStartRef.current = Date.now();
  };

  const loadCurrent = async () => {
    setBusy(true);
    setError('');
    try {
      const q = await api.getCurrentQuestion(sessionId);
      applyQuestion(q);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setFinished(false);
    setScoreTotal(0);
    setAnsweredCount(0);
    setCorrectCount(0);
    setShareMessage('');
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
  }, [sessionId]);

  useEffect(() => {
    if (sessionMode !== 'blitz' && sessionMode !== 'story') return undefined;
    if (!Number.isFinite(blitzRemaining)) return undefined;
    if (finished) return undefined;
    if (busy) return undefined;
    // Blitz uses a per-question timer. Freeze the client countdown while showing
    // answer feedback so the 1s transition delay doesn't "steal" time visually.
    if (sessionMode === 'blitz' && answerResult) return undefined;
    if (Number(blitzRemaining) <= 0) return undefined;

    const t = window.setInterval(() => {
      setBlitzRemaining((v) => {
        if (!Number.isFinite(v)) return v;
        return Math.max(0, Number(v) - 1);
      });
    }, 1000);

    return () => window.clearInterval(t);
  }, [sessionMode, blitzRemaining, finished, busy, answerResult]);

  useEffect(() => {
    if (sessionMode !== 'blitz' && sessionMode !== 'story') return;
    if (!Number.isFinite(blitzRemaining)) return;
    if (finished) return;
    if (timeUpRef.current) return;
    if (Number(blitzRemaining) > 0) return;

    timeUpRef.current = true;
    if (sessionMode === 'blitz') {
      const first = question?.options?.[0]?.id || null;
      if (first) submit(first);
      else finish('completed');
      return;
    }
    finish('abandoned');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMode, blitzRemaining, finished]);

  const title = useMemo(() => {
    if (!question) return STRINGS.PLAY_SESSION.header.question;
    const a = Number(question.question_number);
    const b = Number(question.total_questions);
    if (Number.isFinite(a) && Number.isFinite(b))
      return STRINGS.PLAY_SESSION.header.questionProgress(a, b);
    return STRINGS.PLAY_SESSION.header.question;
  }, [question]);

  const timeInfo = useMemo(() => {
    if (!question) return null;
    if ((question.mode === 'blitz' || question.mode === 'story') && Number.isFinite(blitzRemaining)) {
      const base = STRINGS.PLAY_SESSION.header.timeLeft(blitzRemaining);
      if (question.mode === 'blitz' && Number.isFinite(Number(question?.strikes_remaining))) {
        return `${base} • ${Number(question.strikes_remaining)} strikes left`;
      }
      return base;
    }
    if (Number.isFinite(Number(question.time_limit_sec))) {
      return STRINGS.PLAY_SESSION.header.timeLimit(question.time_limit_sec);
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

  // ✅ single active dot, mapped to question index
  const storyDotActiveIndex = useMemo(() => {
    const qNum = Math.max(1, Number(question?.question_number) || 1);
    const total = Math.max(1, Number(question?.total_questions) || 1);
    const dots = Math.max(1, storyDots);
    const idx = Math.round(((qNum - 1) / Math.max(1, total - 1)) * (dots - 1));
    return Math.max(0, Math.min(dots - 1, idx));
  }, [question?.question_number, question?.total_questions, storyDots]);

  const accuracyPct = useMemo(() => {
    if (!answeredCount) return 0;
    return clampPct(Math.round((correctCount / answeredCount) * 100));
  }, [answeredCount, correctCount]);

  const modeLabel = useMemo(() => {
    const m = String(sessionMode || '').toLowerCase();
    if (m === 'story') return 'Story Mode';
    if (m === 'classic') return 'Classic Mode';
    if (m === 'blitz') return 'Blitz Mode';
    if (m === 'millionaire') return 'Millionaire';
    if (m === 'custom') return 'Custom Quiz';
    return m ? `${m[0].toUpperCase()}${m.slice(1)}` : 'Game';
  }, [sessionMode]);

  const scoreDisplay = useMemo(() => {
    if (String(sessionMode || '').toLowerCase() === 'millionaire') {
      return formatMoney(scoreTotal);
    }
    return String(scoreTotal);
  }, [sessionMode, scoreTotal]);

  const shareText = useMemo(() => {
    const parts = [];
    parts.push(`🎮 I just scored ${scoreDisplay} in ${modeLabel}!`);
    if (isStory && Number.isFinite(Number(storyLevelNumber))) {
      parts.push(`Level ${Number(storyLevelNumber)}`);
    }
    parts.push('Can you beat me on TriviaVerse? 🚀');
    return parts.join(' ');
  }, [isStory, modeLabel, scoreDisplay, storyLevelNumber]);

  const shareUrl = useMemo(() => {
    try {
      return window.location?.origin || '';
    } catch {
      return '';
    }
  }, []);

  const doShare = async () => {
    const payloadText = shareUrl ? `${shareText}\n${shareUrl}` : shareText;
    setShareMessage('');

    try {
      if (navigator?.share) {
        await navigator.share({
          title: 'TriviaVerse',
          text: shareText,
          url: shareUrl || undefined,
        });
        setShareMessage('Shared!');
        return;
      }
    } catch {
      // fall back to clipboard
    }

    try {
      await navigator.clipboard.writeText(payloadText);
      setShareMessage('Copied to clipboard!');
    } catch {
      setShareMessage('Copy failed — your browser blocked clipboard access.');
    }
  };

  const playAgain = async () => {
    setShareMessage('');

    const mode = String(sessionMode || '').toLowerCase();
    if (isStory && Number.isFinite(Number(storyLevelNumber))) {
      setBusy(true);
      setError('');
      try {
        const res = await api.startStorySession({
          level_number: Number(storyLevelNumber),
        });
        const sid = res?.session_id;
        if (sid) {
          window.location.hash = `#/play/${encodeURIComponent(String(sid))}?from=story&level=${encodeURIComponent(
            String(storyLevelNumber)
          )}`;
        } else {
          window.location.hash = '#/story';
        }
      } catch (err) {
        if (isUnauthorized(err)) return onRequireAuth?.('play');
        setError(getApiErrorMessage(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'classic') window.location.hash = '#/classic';
    else if (mode === 'blitz') window.location.hash = '#/blitz';
    else if (mode === 'millionaire') window.location.hash = '#/millionaire';
    else window.location.hash = '#/quizzes';
  };

  const storyEmoji = useMemo(() => {
    if (!answerResult) return '🤔';
    return answerResult.is_correct
      ? ICONS.common.moodCorrect
      : ICONS.common.moodWrong;
  }, [answerResult]);

  const submit = async (chosenOptionId) => {
    if (!question || !chosenOptionId || busy || answerResult) return;
    const submitSeq = (submitSeqRef.current += 1);
    setPendingChoiceId(chosenOptionId);
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
      if (Number.isFinite(Number(result.score_total)))
        setScoreTotal(result.score_total);
      if (Number.isFinite(Number(result.current_prize)))
        setScoreTotal(result.current_prize);
      if (Number.isFinite(Number(result.speed_bonus)))
        setSpeedBonus(result.speed_bonus);
      if (
        (question.mode === 'blitz' || question.mode === 'story') &&
        Number.isFinite(Number(result.time_remaining_sec))
      ) {
        setBlitzRemaining(Number(result.time_remaining_sec));
      } else if (question.mode !== 'blitz' && question.mode !== 'story') {
        setBlitzRemaining(null);
      }

      if (sessionMode === 'blitz' && result?.status === 'abandoned') {
        setFinished(true);
        setQuestion(null);
        return;
      }

      if (!result.next_question_available) {
        if (nextTransitionMs) await sleep(nextTransitionMs);
        if (submitSeqRef.current !== submitSeq) return;
        await finish(result?.status === 'abandoned' ? 'abandoned' : 'completed');
        return;
      }

      const transitionStartMs = Date.now();
      const nextQuestionPromise = result?.next_question
        ? Promise.resolve(result.next_question)
        : api.getCurrentQuestion(sessionId);

      const [, nextQuestion] = await Promise.all([
        nextTransitionMs ? sleep(nextTransitionMs) : Promise.resolve(),
        nextQuestionPromise,
      ]);
      if (submitSeqRef.current !== submitSeq) return;
      if (
        question?.mode === 'blitz' &&
        nextQuestion &&
        Number.isFinite(Number(nextQuestion?.time_remaining_sec))
      ) {
        const elapsed = Math.floor((Date.now() - transitionStartMs) / 1000);
        nextQuestion.time_remaining_sec = Math.max(
          0,
          Number(nextQuestion.time_remaining_sec) - elapsed
        );
      }
      applyQuestion(nextQuestion);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      if (err?.response?.data?.code === 'TIME_UP') {
        finish(sessionMode === 'story' ? 'abandoned' : 'completed');
        return;
      }
      setError(getApiErrorMessage(err));
      setPendingChoiceId(null);
    } finally {
      setBusy(false);
    }
  };

  const finish = async (status = 'completed') => {
    setBusy(true);
    setError('');
    try {
      await api.finishSession(sessionId, { status });
      if (isStory && !user) {
        const a = Number(answeredCount) || 0;
        const c = Number(correctCount) || 0;
        const passed = status === 'completed' ? (a > 0 ? c / a >= 0.5 : false) : false;
        saveGuestStoryResult(storyLevelNumber, { scoreTotal, passed });
      }
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
      setLifelinesUsed((prev) =>
        Array.from(new Set([...(prev || []), lifeline_type]))
      );

      if (
        res?.lifeline_type === 'fifty_fifty' &&
        Array.isArray(res.disabled_option_ids)
      ) {
        setDisabledOptionIds(res.disabled_option_ids);
      } else if (res?.lifeline_type === 'audience' && res?.audience_poll) {
        setAudiencePoll(res.audience_poll);
      } else if (res?.lifeline_type === 'phone') {
        setPhoneSuggestionOptionId(res.suggestion_option_id || null);
        setPhoneMessage(res.message || '');
      } else if (res?.lifeline_type === 'skip' && res?.skipped) {
        setAnswerResult({
          is_correct: false,
          skipped: true,
          next_question_available: true,
        });
        window.setTimeout(() => loadCurrent(), 80);
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={PlaySessionStyle.page}>
      <div
        style={
          isStory ? PlaySessionStyle.containerStory : PlaySessionStyle.container
        }
      >
        {!finished && !isStory ? (
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
              {timeInfo && (
                <span style={PlaySessionStyle.pill}>{timeInfo}</span>
              )}
              <span style={PlaySessionStyle.pill}>
                {question?.mode === 'millionaire'
                  ? `${ICONS.common.money} ${STRINGS.PLAY_SESSION.header.prizeLabel}`
                  : `${ICONS.common.trophy} ${STRINGS.PLAY_SESSION.header.scoreLabel}`}
                : {scoreTotal}
              </span>
            </div>
          </div>
        ) : !finished && question ? (
          <div style={PlaySessionStyle.storyTop}>
            <div style={PlaySessionStyle.storyTopRow}>
              <div style={PlaySessionStyle.storyCount}>
                {STRINGS.PLAY_SESSION.header.questionOf(
                  question.question_number,
                  question.total_questions
                )}
              </div>

              <div
                style={PlaySessionStyle.storyDots}
                aria-label={STRINGS.PLAY_SESSION.aria.progressDots}
              >
                {Array.from({ length: storyDots }).map((_, i) => (
                  <span
                    key={i}
                    style={PlaySessionStyle.storyDotItem(
                      i === storyDotActiveIndex
                    )}
                  />
                ))}
              </div>
            </div>

            <div
              style={PlaySessionStyle.storyTrack}
              aria-label={STRINGS.PLAY_SESSION.aria.progressBar}
            >
              <div style={PlaySessionStyle.storyFillWidth(storyProgressPct)} />
            </div>
          </div>
        ) : null}

        {!!error && (
          <div className="tv-card" style={PlaySessionStyle.errorCard}>
            {error}
          </div>
        )}

        {finished && !question ? (
          <div className="tv-results">
            <div className="tv-results__hero">
              <div className="tv-results__heroIcons" aria-hidden="true">
                <span className="tv-results__heroIcon">
                  {ICONS.common.rocket}
                </span>
                <span className="tv-results__heroIcon">{ICONS.common.book}</span>
              </div>

              <h1 className="tv-results__title">KEEP GOING!</h1>
              <div className="tv-results__subtitle">Every try makes you better!</div>

              <div className="tv-card tv-results__shareCard">
                <div className="tv-results__shareTitle">
                  {ICONS.common.phone} Share your score with friends!
                </div>
                <div className="tv-results__sharePreview">
                  {ICONS.common.gamepad} I just scored{' '}
                  <span className="tv-results__shareScore">{scoreDisplay}</span>{' '}
                  in <span className="tv-results__shareMode">{modeLabel}</span>
                  {isStory && Number.isFinite(Number(storyLevelNumber))
                    ? ` (Level ${Number(storyLevelNumber)})`
                    : ''}
                  !
                  <div className="tv-results__shareHint">
                    Can you beat me on TriviaVerse? {ICONS.common.rocket}
                  </div>
                </div>
              </div>

              <div className="tv-results__keepPlaying">
                {ICONS.common.rocket} Keep playing to improve! {ICONS.common.rocket}
              </div>
            </div>

            <div className="tv-card tv-results__card">
              <div className="tv-results__modeLine">{modeLabel}</div>
              {isStory && Number.isFinite(Number(storyLevelNumber)) ? (
                <div className="tv-results__levelLine">
                  Level {Number(storyLevelNumber)} {ICONS.common.star}
                </div>
              ) : null}

              <div className="tv-results__scorePanel">
                <div className="tv-results__scoreLabel">YOUR SCORE</div>
                <div className="tv-results__scoreValue">{scoreDisplay}</div>
                <div className="tv-results__scoreMeta">
                  {ICONS.common.target} {accuracyPct}% Accuracy!
                </div>
              </div>

              <div className="tv-results__statsGrid">
                <div className="tv-results__stat tv-results__stat--blue">
                  <div className="tv-results__statIcon">{ICONS.common.target}</div>
                  <div className="tv-results__statValue">
                    {correctCount}/{answeredCount}
                  </div>
                  <div className="tv-results__statLabel">
                    Correct! {ICONS.common.tick}
                  </div>
                </div>
                <div className="tv-results__stat tv-results__stat--purple">
                  <div className="tv-results__statIcon">{ICONS.common.trophy}</div>
                  <div className="tv-results__statValue">{accuracyPct}%</div>
                  <div className="tv-results__statLabel">
                    Accuracy! {ICONS.common.target}
                  </div>
                </div>
              </div>
            </div>

            <div className="tv-results__actions">
              <button
                type="button"
                className="tv-card tv-card--hover tv-results__btn"
                onClick={() =>
                  onNavigateHome
                    ? onNavigateHome()
                    : (window.location.hash = '#/')
                }
                disabled={busy}
              >
                🏠 Home
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover tv-results__btn"
                onClick={playAgain}
                disabled={busy}
              >
                {ICONS.common.refresh} Again!
              </button>
              <button
                type="button"
                className="tv-card tv-card--hover tv-results__btn tv-results__btn--share"
                onClick={doShare}
                disabled={busy}
              >
                {ICONS.common.rocket} Share!
              </button>
            </div>

            {!!shareMessage && (
              <div className="tv-results__shareMessage">{shareMessage}</div>
            )}

            {/* Hidden but useful for quick manual copy from DevTools if needed */}
            <span className="tv-results__shareText" aria-hidden="true">
              {shareText}
            </span>
          </div>
        ) : !question ? (
          <div style={PlaySessionStyle.loading}>
            {busy
              ? STRINGS.PLAY_SESSION.states.loading
              : STRINGS.PLAY_SESSION.states.noQuestion}
          </div>
        ) : !isStory && question.mode === 'millionaire' ? (
          /* ===== Millionaire mode: unchanged ===== */
          <div style={PlaySessionStyle.millionaireShell}>
            <div style={PlaySessionStyle.millionaireTopBar}>
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={PlaySessionStyle.millionaireExitBtn}
                onClick={walkAway}
                disabled={busy}
              >
                {STRINGS.COMMON.symbols.leftArrow}{' '}
                {STRINGS.PLAY_SESSION.millionaire.exit}
              </button>

              <div style={PlaySessionStyle.millionairePrizePill}>
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
                  <div style={PlaySessionStyle.millionaireQuestion}>
                    {question.question_text}
                  </div>

                  {!!phoneMessage && (
                    <div style={PlaySessionStyle.millionaireHint}>
                      {ICONS.common.phone} {phoneMessage}
                    </div>
                  )}

                  <div style={PlaySessionStyle.millionaireOptions}>
                    {(question.options || []).slice(0, 4).map((o) => {
                      const disabled =
                        busy ||
                        !!answerResult ||
                        disabledOptionIds.includes(o.id);
                      const suggested = phoneSuggestionOptionId === o.id;
                      const selected = pendingChoiceId === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          className="tv-card tv-card--hover"
                          style={PlaySessionStyle.millionaireOptionBtnState(
                            suggested || selected,
                            disabled
                          )}
                          disabled={disabled}
                          onClick={() => submit(o.id)}
                        >
                          <span style={PlaySessionStyle.millionaireOptionLabel}>
                            {o.label}
                          </span>
                          <span style={PlaySessionStyle.millionaireOptionText}>
                            {o.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!!answerResult && (
                    <div
                      style={PlaySessionStyle.resultState(
                        answerResult.is_correct
                      )}
                    >
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
                      disabled={
                        busy ||
                        !!answerResult ||
                        lifelinesUsed.includes('fifty_fifty')
                      }
                      onClick={() => triggerLifeline('fifty_fifty')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>
                        ½
                      </div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>
                        {STRINGS.PLAY_SESSION.millionaire.lifelineFifty}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.millionaireLifelineBtn}
                      disabled={
                        busy ||
                        !!answerResult ||
                        lifelinesUsed.includes('phone')
                      }
                      onClick={() => triggerLifeline('phone')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>
                        {ICONS.common.phone}
                      </div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>
                        {STRINGS.PLAY_SESSION.millionaire.lifelinePhone}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="tv-card tv-card--hover"
                      style={PlaySessionStyle.millionaireLifelineBtn}
                      disabled={
                        busy ||
                        !!answerResult ||
                        lifelinesUsed.includes('audience')
                      }
                      onClick={() => triggerLifeline('audience')}
                    >
                      <div style={PlaySessionStyle.millionaireLifelineIcon}>
                        {ICONS.common.people}
                      </div>
                      <div style={PlaySessionStyle.millionaireLifelineText}>
                        {STRINGS.PLAY_SESSION.millionaire.lifelineAudience}
                      </div>
                    </button>
                  </div>

                  {audiencePoll ? (
                    <div style={PlaySessionStyle.millionaireHint}>
                      {ICONS.common.people}{' '}
                      {STRINGS.PLAY_SESSION.millionaire.audienceLabel}:{' '}
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
                <div style={PlaySessionStyle.millionaireLadderTitle}>
                  {STRINGS.PLAY_SESSION.millionaire.prizeLadder}
                </div>
                <div style={PlaySessionStyle.millionaireLadderList}>
                  {prizeLadder.map((row) => {
                    const active =
                      Number(question.question_number) === row.index;
                    return (
                      <div
                        key={row.index}
                        style={PlaySessionStyle.millionaireLadderRowState(
                          active
                        )}
                      >
                        <span style={PlaySessionStyle.millionaireLadderNum}>
                          {row.index}
                        </span>
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
          /* ===== Default mode (non-story): unchanged ===== */
          <div className="tv-card" style={PlaySessionStyle.card}>
            <div style={PlaySessionStyle.qText}>{question.question_text}</div>

            {question.mode === 'millionaire' ? (
              <div style={PlaySessionStyle.pillsCentered}>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={
                    busy ||
                    !!answerResult ||
                    lifelinesUsed.includes('fifty_fifty')
                  }
                  onClick={() => triggerLifeline('fifty_fifty')}
                >
                  {STRINGS.PLAY_SESSION.millionaire.lifelineFiftyShort}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={
                    busy || !!answerResult || lifelinesUsed.includes('phone')
                  }
                  onClick={() => triggerLifeline('phone')}
                >
                  {STRINGS.PLAY_SESSION.millionaire.lifelinePhone}
                </button>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={PlaySessionStyle.optionBtn}
                  disabled={
                    busy || !!answerResult || lifelinesUsed.includes('audience')
                  }
                  onClick={() => triggerLifeline('audience')}
                >
                  {STRINGS.PLAY_SESSION.millionaire.lifelineAudience}
                </button>
              </div>
            ) : null}

            {question.mode === 'millionaire' && audiencePoll ? (
              <div style={PlaySessionStyle.audiencePollCard}>
                {STRINGS.PLAY_SESSION.millionaire.audiencePollLabel}:{' '}
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

                const isCorrect =
                  reveal &&
                  correctOptionId != null &&
                  String(o.id) === String(correctOptionId);
                const isChosen =
                  reveal &&
                  chosenOptionId != null &&
                  String(o.id) === String(chosenOptionId);
                const isWrongChosen = reveal && isChosen && !isCorrect;

                const state = reveal
                  ? isCorrect
                    ? 'correct'
                    : isWrongChosen
                      ? 'wrong'
                      : 'dim'
                  : suggested || selected
                    ? 'idle'
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
                    onClick={() => submit(o.id)}
                  >
                    <span style={PlaySessionStyle.optionLabel}>{o.label}</span>
                    <span style={PlaySessionStyle.optionText}>{o.text}</span>
                    {!!resultIcon && (
                      <span style={PlaySessionStyle.optionResultIcon}>{resultIcon}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {!!answerResult && (
              <div
                style={PlaySessionStyle.resultState(answerResult.is_correct)}
              >
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
                  onClick={
                    answerResult.next_question_available ? loadCurrent : finish
                  }
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
                onClick={loadCurrent}
                title={STRINGS.PLAY_SESSION.actions.reloadTitle}
              >
                {STRINGS.COMMON.buttons.refresh} {ICONS.common.refresh}
              </button>
            </div>
          </div>
        ) : (
          /* ===== Story mode: UPDATED to match left screenshot ===== */
          <>
            <div className="tv-card" style={PlaySessionStyle.storyCard}>
              <div
                style={PlaySessionStyle.storyEmoji}
                aria-label={STRINGS.PLAY_SESSION.aria.mood}
              >
                {storyEmoji}
              </div>

              <div style={PlaySessionStyle.storyQuestion}>
                {question.question_text}
              </div>

              <div style={PlaySessionStyle.storyOptions}>
                {(question.options || []).slice(0, 4).map((o, idx) => {
                  const disabled = busy || !!answerResult;
                  const theme = getStoryOptionTheme(idx);
                  const selected = pendingChoiceId === o.id;
                  const reveal = !!answerResult && !answerResult?.skipped;
                  const correctOptionId = reveal ? answerResult?.correct_option_id : null;
                  const chosenOptionId =
                    reveal ? answerResult?.chosen_option_id ?? pendingChoiceId : pendingChoiceId;

                  const isCorrect =
                    reveal &&
                    correctOptionId != null &&
                    String(o.id) === String(correctOptionId);
                  const isChosen =
                    reveal &&
                    chosenOptionId != null &&
                    String(o.id) === String(chosenOptionId);
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
                      style={{
                        ...PlaySessionStyle.storyOptionBtnState(selected),
                        ...(dim
                          ? { opacity: 0.72, filter: 'saturate(0.75) brightness(1.06)' }
                          : {}),
                      }}
                      disabled={disabled}
                      onClick={() => submit(o.id)}
                    >
                      <div style={PlaySessionStyle.storyOptionInnerBg(bg)}>
                        <div style={PlaySessionStyle.storyShape}>
                          {theme.shape}
                        </div>
                        <div style={PlaySessionStyle.storyOptionText}>
                          {o.text}
                        </div>
                        {!!resultIcon && (
                          <div style={PlaySessionStyle.storyResultIcon}>{resultIcon}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!!answerResult && (
                <div
                  style={PlaySessionStyle.storyToastState(
                    answerResult.is_correct
                  )}
                >
                  {answerResult.is_correct
                    ? STRINGS.PLAY_SESSION.results.correctShort
                    : STRINGS.PLAY_SESSION.results.wrongShort}
                </div>
              )}
            </div>

            <div style={PlaySessionStyle.storyBottom}>
              <div style={PlaySessionStyle.storyBottomPill}>
                {correctCount} Correct! 🎉
              </div>
              <div style={PlaySessionStyle.storyBottomPill}>
                {ICONS.common.bolt} {accuracyPct}% 🔥
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
