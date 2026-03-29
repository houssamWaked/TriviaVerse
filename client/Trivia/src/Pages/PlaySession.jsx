import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import { saveGuestStoryResult } from '@/utils/guestStoryProgress';
import { saveGuestClassicResult } from '@/utils/guestClassicProgress';
import PlaySessionTopBar from '@/Components/PlaySession/PlaySessionTopBar';
import PlaySessionResults from '@/Components/PlaySession/PlaySessionResults';
import PlaySessionMillionaireView from '@/Components/PlaySession/PlaySessionMillionaireView';
import PlaySessionDefaultQuestionView from '@/Components/PlaySession/PlaySessionDefaultQuestionView';
import PlaySessionStoryView from '@/Components/PlaySession/PlaySessionStoryView';
import {
  clampPct,
  clampStars,
  computeStoryOutcomeFromCounts,
  formatMoney,
} from '@/Components/PlaySession/playSessionHelpers';

export default function PlaySession({
  sessionId,
  user,
  onRequireAuth,
  onBack,
  onNavigateHome,
  backLabel = STRINGS.COMMON.buttons.back,
  variant = 'default', // 'default' | 'story'
  storyLevelNumber = null,
  classicCategoryId = null,
  classicLevelNumber = null,
}) {
  const isStory = variant === 'story';
  // Transition delay between answering and the next question.
  // Story + Blitz intentionally pause to show correct/wrong feedback.
  const storyTransitionMs = 1000;
  const blitzTransitionMs = 1000;
  const classicTransitionMs = 1000;
  const millionaireCorrectTransitionMs = 850;
  const getNextTransitionMs = (q) => {
    if (isStory) return storyTransitionMs;
    const m = String(q?.mode || '').toLowerCase();
    if (m === 'blitz') return blitzTransitionMs;
    if (m === 'classic') return classicTransitionMs;
    return 0;
  };
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
  const [storyOutcome, setStoryOutcome] = useState(null);
  const [classicOutcome, setClassicOutcome] = useState(null);
  const [classicLevelsMax, setClassicLevelsMax] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [review, setReview] = useState(null);

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
    if (mode === 'blitz' && Number.isFinite(Number(q?.time_remaining_sec))) {
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
    setStoryOutcome(null);
    setClassicOutcome(null);
    setClassicLevelsMax(null);
    setReviewBusy(false);
    setReviewError('');
    setReview(null);
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
    let alive = true;
    const mode = String(sessionMode || '').toLowerCase();
    const cid = String(classicCategoryId || '').trim();
    if (!finished) return undefined;
    if (mode !== 'classic') return undefined;
    if (!cid) return undefined;

    api
      .getClassicCategoryLevels(cid)
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res?.levels) ? res.levels : [];
        const max = list
          .map((l) => Number(l?.level_number))
          .filter((n) => Number.isFinite(n) && n > 0)
          .reduce((acc, n) => Math.max(acc, n), 0);
        setClassicLevelsMax(max || null);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [finished, sessionMode, classicCategoryId]);

  useEffect(() => {
    let alive = true;
    if (!finished) return undefined;

    setReviewBusy(true);
    setReviewError('');

    api
      .getSessionReview(sessionId)
      .then((data) => {
        if (!alive) return;
        setReview(data || null);
      })
      .catch((err) => {
        if (!alive) return;
        if (isUnauthorized(err)) {
          setReviewError('Login required to view your answer explanations.');
          return;
        }
        setReviewError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!alive) return;
        setReviewBusy(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, sessionId]);

  useEffect(() => {
    if (sessionMode !== 'blitz') return undefined;
    if (!Number.isFinite(blitzRemaining)) return undefined;
    if (finished) return undefined;
    // Blitz: freeze countdown while awaiting network/transition feedback.
    if (busy) return undefined;
    // Blitz uses a per-question timer. Freeze the client countdown while showing
    // answer feedback so the 1s transition delay doesn't "steal" time visually.
    if (answerResult) return undefined;
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
    if (sessionMode !== 'blitz') return;
    if (!Number.isFinite(blitzRemaining)) return;
    if (finished) return;
    if (busy) return;
    if (timeUpRef.current) return;
    if (Number(blitzRemaining) > 0) return;

    timeUpRef.current = true;
    const first = question?.options?.[0]?.id || null;
    if (first) submit(first);
    else finish('completed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMode, blitzRemaining, finished]);

  const title = useMemo(() => {
    if (!question) return STRINGS.PLAY_SESSION.header.question;
    if (String(question.mode || '').toLowerCase() === 'blitz') return STRINGS.PLAY_SESSION.header.question;
    const a = Number(question.question_number);
    const b = Number(question.total_questions);
    if (Number.isFinite(a) && Number.isFinite(b))
      return STRINGS.PLAY_SESSION.header.questionProgress(a, b);
    return STRINGS.PLAY_SESSION.header.question;
  }, [question]);

  const timeInfo = useMemo(() => {
    if (!question) return null;
    if (String(question.mode || '').toLowerCase() === 'classic') return null;
    if (question.mode === 'blitz' && Number.isFinite(blitzRemaining)) {
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

  const storyResult = useMemo(() => {
    if (!isStory) return null;
    const computed = computeStoryOutcomeFromCounts({
      correctCount,
      totalCount: answeredCount,
    });
    const passed = Boolean(storyOutcome?.passed ?? computed.passed);
    const stars = Math.max(0, Math.min(3, Number(storyOutcome?.stars ?? computed.stars) || 0));
    return { passed, stars };
  }, [isStory, answeredCount, correctCount, storyOutcome]);

  const classicResult = useMemo(() => {
    const mode = String(sessionMode || '').toLowerCase();
    const cid = String(classicCategoryId || '').trim();
    const levelNum = Number(classicLevelNumber);
    if (mode !== 'classic') return null;
    if (!cid || !Number.isFinite(levelNum) || levelNum < 1) return null;

    const computed = computeStoryOutcomeFromCounts({
      correctCount,
      totalCount: answeredCount,
    });

    const server = classicOutcome && typeof classicOutcome === 'object' ? classicOutcome : null;
    const passed = Boolean(server?.passed ?? computed.passed);
    const stars = clampStars(server?.stars ?? computed.stars);

    const nextLevelNumber = Number(server?.next_level_number) || levelNum + 1;
    const hasNextLevel =
      typeof server?.has_next_level === 'boolean'
        ? server.has_next_level
        : Number.isFinite(Number(classicLevelsMax))
          ? levelNum < Number(classicLevelsMax)
          : false;

    return { passed, stars, nextLevelNumber, hasNextLevel, levelNum };
  }, [
    sessionMode,
    classicCategoryId,
    classicLevelNumber,
    answeredCount,
    correctCount,
    classicOutcome,
    classicLevelsMax,
  ]);

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
    if (classicResult?.levelNum) {
      parts.push(`Level ${Number(classicResult.levelNum)}`);
    }
    parts.push('Can you beat me on TriviaVerse? 🚀');
    return parts.join(' ');
  }, [isStory, modeLabel, scoreDisplay, storyLevelNumber, classicResult?.levelNum]);

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

    if (mode === 'classic' && classicResult?.levelNum && String(classicCategoryId || '').trim()) {
      setBusy(true);
      setError('');
      try {
        const cid = String(classicCategoryId).trim();
        const lvl = Number(classicResult.levelNum);
        const res = await api.startClassicSession({ category_id: cid, level_number: lvl });
        const sid = res?.session_id;
        if (sid) {
          window.location.hash = `#/play/${encodeURIComponent(String(sid))}?from=classic&category=${encodeURIComponent(
            cid
          )}&level=${encodeURIComponent(String(lvl))}`;
        } else {
          window.location.hash = '#/classic';
        }
      } catch (err) {
        if (isUnauthorized(err)) return onRequireAuth?.('play');
        setError(getApiErrorMessage(err));
        window.location.hash = '#/classic';
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

  const playNextLevel = async () => {
    if (!isStory || !Number.isFinite(Number(storyLevelNumber))) return;
    const nextLevelNumber = Number(storyLevelNumber) + 1;
    if (!Number.isFinite(nextLevelNumber) || nextLevelNumber < 1) return;

    setShareMessage('');
    setBusy(true);
    setError('');
    try {
      const res = await api.startStorySession({ level_number: nextLevelNumber });
      const sid = res?.session_id;
      if (sid) {
        window.location.hash = `#/play/${encodeURIComponent(String(sid))}?from=story&level=${encodeURIComponent(
          String(nextLevelNumber)
        )}`;
      } else {
        window.location.hash = '#/story';
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
      window.location.hash = '#/story';
    } finally {
      setBusy(false);
    }
  };

  const playNextClassicLevel = async () => {
    const cid = String(classicCategoryId || '').trim();
    const lvl = classicResult?.nextLevelNumber;
    if (!cid) return;
    if (!Number.isFinite(Number(lvl)) || Number(lvl) < 1) return;
    if (!classicResult?.passed) return;

    setShareMessage('');
    setBusy(true);
    setError('');
    try {
      const res = await api.startClassicSession({ category_id: cid, level_number: Number(lvl) });
      const sid = res?.session_id;
      if (sid) {
        window.location.hash = `#/play/${encodeURIComponent(String(sid))}?from=classic&category=${encodeURIComponent(
          cid
        )}&level=${encodeURIComponent(String(lvl))}`;
      } else {
        window.location.hash = '#/classic';
      }
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('play');
      setError(getApiErrorMessage(err));
      window.location.hash = '#/classic';
    } finally {
      setBusy(false);
    }
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
    const nextTransitionMs = getNextTransitionMs(question);
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
      if (question.mode === 'blitz' && Number.isFinite(Number(result.time_remaining_sec))) {
        setBlitzRemaining(Number(result.time_remaining_sec));
      } else if (question.mode !== 'blitz') {
        setBlitzRemaining(null);
      }

      if (sessionMode === 'blitz' && result?.status === 'abandoned') {
        setFinished(true);
        setQuestion(null);
        return;
      }

      const isMillionaire =
        !isStory && String(question?.mode || '').toLowerCase() === 'millionaire';
      const transitionMs =
        isMillionaire && result.is_correct
          ? millionaireCorrectTransitionMs
          : nextTransitionMs;

      if (!result.next_question_available) {
        if (transitionMs) await sleep(transitionMs);
        if (submitSeqRef.current !== submitSeq) return;
        await finish(result?.status === 'abandoned' ? 'abandoned' : 'completed');
        return;
      }

      const transitionStartMs = Date.now();
      const nextQuestionPromise = result?.next_question
        ? Promise.resolve(result.next_question)
        : api.getCurrentQuestion(sessionId);

      const [, nextQuestion] = await Promise.all([
        transitionMs ? sleep(transitionMs) : Promise.resolve(),
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
        finish('completed');
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
      const res = await api.finishSession(sessionId, { status });

      if (isStory) {
        const computed = computeStoryOutcomeFromCounts({
          correctCount,
          totalCount: answeredCount,
        });
        const server = res?.story && typeof res.story === 'object' ? res.story : null;
        const passed =
          status === 'completed' ? Boolean(server?.passed ?? computed.passed) : false;
        const stars =
          status === 'completed'
            ? Math.max(0, Math.min(3, Number(server?.stars ?? computed.stars) || 0))
            : 0;

        setStoryOutcome({ passed, stars });

        if (!user) {
          saveGuestStoryResult(storyLevelNumber, { scoreTotal, passed, stars });
        }
      }

      if (String(sessionMode || '').toLowerCase() === 'classic') {
        const cid = String(classicCategoryId || '').trim();
        const levelNum = Number(classicLevelNumber);
        const computed = computeStoryOutcomeFromCounts({
          correctCount,
          totalCount: answeredCount,
        });
        const server = res?.classic && typeof res.classic === 'object' ? res.classic : null;
        const passed =
          status === 'completed' ? Boolean(server?.passed ?? computed.passed) : false;
        const stars =
          status === 'completed'
            ? clampStars(server?.stars ?? computed.stars)
            : 0;

        if (status === 'completed') {
          setClassicOutcome({
            passed,
            stars,
            has_next_level: server?.has_next_level ?? null,
            next_level_number: server?.next_level_number ?? null,
          });

          if (!user && cid && Number.isFinite(levelNum) && levelNum > 0) {
            saveGuestClassicResult(cid, levelNum, { scoreTotal, passed, stars });
          }
        }
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
        <PlaySessionTopBar
          finished={finished}
          isStory={isStory}
          question={question}
          busy={busy}
          onBack={onBack}
          backLabel={backLabel}
          title={title}
          timeInfo={timeInfo}
          scoreTotal={scoreTotal}
          storyDots={storyDots}
          storyDotActiveIndex={storyDotActiveIndex}
          storyProgressPct={storyProgressPct}
        />

        {!!error && (
          <div className="tv-card" style={PlaySessionStyle.errorCard}>
            {error}
          </div>
        )}

        {finished && !question ? (
          <PlaySessionResults
            busy={busy}
            isStory={isStory}
            storyLevelNumber={storyLevelNumber}
            storyResult={storyResult}
            classicResult={classicResult}
            scoreDisplay={scoreDisplay}
            accuracyPct={accuracyPct}
            correctCount={correctCount}
            answeredCount={answeredCount}
            reviewBusy={reviewBusy}
            reviewError={reviewError}
            review={review}
            onNavigateHome={onNavigateHome ? onNavigateHome : () => { window.location.hash = '#/'; }}
            playNextLevel={playNextLevel}
            playNextClassicLevel={playNextClassicLevel}
            playAgain={playAgain}
            doShare={doShare}
            shareMessage={shareMessage}
            shareText={shareText}
            modeLabel={modeLabel}
          />
        ) : !question ? (
          <div style={PlaySessionStyle.loading}>
            {busy
              ? STRINGS.PLAY_SESSION.states.loading
              : STRINGS.PLAY_SESSION.states.noQuestion}
          </div>
        ) : !isStory && question.mode === 'millionaire' ? (
          <PlaySessionMillionaireView
            question={question}
            busy={busy}
            answerResult={answerResult}
            disabledOptionIds={disabledOptionIds}
            phoneSuggestionOptionId={phoneSuggestionOptionId}
            phoneMessage={phoneMessage}
            audiencePoll={audiencePoll}
            lifelinesUsed={lifelinesUsed}
            prizeLadder={prizeLadder}
            scoreTotal={scoreTotal}
            onSubmit={submit}
            onTriggerLifeline={triggerLifeline}
            onWalkAway={walkAway}
            formatMoney={formatMoney}
            pendingChoiceId={pendingChoiceId}
          />
        ) : !isStory ? (
          <PlaySessionDefaultQuestionView
            question={question}
            busy={busy}
            answerResult={answerResult}
            lifelinesUsed={lifelinesUsed}
            audiencePoll={audiencePoll}
            phoneMessage={phoneMessage}
            phoneSuggestionOptionId={phoneSuggestionOptionId}
            pendingChoiceId={pendingChoiceId}
            disabledOptionIds={disabledOptionIds}
            speedBonus={speedBonus}
            onSubmit={submit}
            onTriggerLifeline={triggerLifeline}
            onLoadCurrent={loadCurrent}
            onFinish={finish}
          />
        ) : (
          <PlaySessionStoryView
            question={question}
            busy={busy}
            answerResult={answerResult}
            pendingChoiceId={pendingChoiceId}
            correctCount={correctCount}
            accuracyPct={accuracyPct}
            storyEmoji={storyEmoji}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}
