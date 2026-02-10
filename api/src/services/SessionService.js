/**
 * Shared session gameplay service.
 */
import AppError from '../utils/AppError.js';
import { sessionCache } from '../utils/sessionCache.js';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MILLIONAIRE_PRIZES = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000,
  500000, 1000000,
];
const STORY_MAX_WRONG = 3;
const BLITZ_TIME_LIMIT_SEC = 15;
const BLITZ_MAX_STRIKES = 3;

function computeStars({ scoreTotal = 0, maxScore = 0, passScoreMin = null }) {
  const score = Math.max(0, Number(scoreTotal) || 0);
  const max = Math.max(0, Number(maxScore) || 0);
  const pass = passScoreMin == null ? null : Math.max(0, Number(passScoreMin) || 0);

  const passed = pass != null ? score >= pass : max > 0 ? score / max >= 0.5 : score > 0;
  if (!passed) return { passed: false, stars: 0 };

  const ratio = max > 0 ? score / max : 1;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.75 ? 2 : 1;
  return { passed: true, stars };
}

function computeTimeRemainingSec(session) {
  if (!session?.started_at) return null;
  const started = new Date(session.started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, 60 - elapsed);
}

function computeTimeRemainingFromStartedAt(started_at) {
  if (!started_at) return null;
  const started = new Date(started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, 60 - elapsed);
}

function computePerQuestionRemainingFromStartedAt(started_at, limitSec) {
  if (!started_at) return null;
  const started = new Date(started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, Math.max(0, Number(limitSec) || 0) - elapsed);
}

function buildAudiencePoll(options) {
  const correct = options.find((o) => !!o.is_correct_snapshot);
  const incorrect = options.filter((o) => !o.is_correct_snapshot);
  if (!correct) return null;

  const correctPct = 55 + Math.floor(Math.random() * 26); // 55-80%
  const remaining = 100 - correctPct;
  const poll = { [correct.id]: correctPct };

  if (incorrect.length === 0) return poll;

  const buckets = incorrect.map((o) => ({ id: o.id, v: 0 }));
  let left = remaining;
  for (let i = 0; i < buckets.length; i += 1) {
    const max = left - (buckets.length - i - 1);
    const add = i === buckets.length - 1 ? left : 1 + Math.floor(Math.random() * max);
    buckets[i].v = add;
    left -= add;
  }

  for (const b of buckets) poll[b.id] = b.v;
  return poll;
}

function pickPhoneSuggestion(options) {
  const correct = options.find((o) => !!o.is_correct_snapshot);
  const incorrect = options.filter((o) => !o.is_correct_snapshot);
  if (!correct) return null;

  const roll = Math.random();
  if (roll < 0.75) return correct.id; // mostly correct
  if (incorrect.length === 0) return correct.id;
  return incorrect[Math.floor(Math.random() * incorrect.length)].id;
}

export class SessionService {
  constructor({
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    sessionAnswerRepository,
    sessionLifelineRepository,
    leaderboardRepository,
    userStatsRepository,
    quizScoreRepository,
    quizRatingRepository,
    storyLevelRepository,
    userStoryProgressRepository,
    storySessionRepository,
  }) {
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.sessionAnswerRepository = sessionAnswerRepository;
    this.sessionLifelineRepository = sessionLifelineRepository;
    this.leaderboardRepository = leaderboardRepository;
    this.userStatsRepository = userStatsRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.storyLevelRepository = storyLevelRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
    this.storySessionRepository = storySessionRepository;
  }

  async assertSessionOwner(sessionId, userId) {
    if (!userId) throw new AppError('Missing Bearer token', 401, 'UNAUTHORIZED');
    const session = await this.gameSessionRepository.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return session;
  }

  async getCurrent(sessionId, userId) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode) {
      const isGuest = !!cached.is_guest;
      if (!isGuest) {
        if (!userId) throw new AppError('Missing Bearer token', 401, 'UNAUTHORIZED');
        if (cached.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
      }
      if (cached.status && cached.status !== 'in_progress') {
        throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
      }

      const idx = Math.max(0, Number(cached.current_index) || 0);
      const current = Array.isArray(cached.questions) ? cached.questions[idx] : null;
      if (!current) throw new AppError('No current question', 404, 'NO_CURRENT_QUESTION');

      const payload = {
        ...current,
        score_total: cached.score_total ?? 0,
      };

      if (cached.mode === 'blitz') {
        const startedAt = cached.question_started_at || cached.started_at;
        payload.time_remaining_sec = computePerQuestionRemainingFromStartedAt(
          startedAt,
          BLITZ_TIME_LIMIT_SEC
        );
        const strikes = Math.max(0, Number(cached.strike_count) || 0);
        payload.strike_count = strikes;
        payload.strikes_remaining = Math.max(0, BLITZ_MAX_STRIKES - strikes);
      } else if (cached.mode === 'story') {
        payload.time_remaining_sec = computeTimeRemainingFromStartedAt(cached.started_at);
      }

      if (cached.mode === 'story') {
        const wrong = Math.max(0, Number(cached.wrong_count) || 0);
        payload.wrong_count = wrong;
        payload.strikes_remaining = Math.max(0, STORY_MAX_WRONG - wrong);
      }

      if (cached.mode === 'millionaire') {
        const lifelines = isGuest
          ? Array.isArray(cached.lifelines)
            ? cached.lifelines
            : []
          : await this.sessionLifelineRepository.listBySessionId(sessionId);
        payload.lifelines_used = lifelines.map((l) => l.lifeline_type);

        const fifty = lifelines.find(
          (l) =>
            l.lifeline_type === 'fifty_fifty' &&
            l.payload_json?.session_question_id === current.session_question_id
        );
        if (fifty?.payload_json?.disabled_option_ids) {
          payload.disabled_option_ids = fifty.payload_json.disabled_option_ids;
        }

        const audience = lifelines.find(
          (l) =>
            l.lifeline_type === 'audience' &&
            l.payload_json?.session_question_id === current.session_question_id
        );
        if (audience?.payload_json?.audience_poll) {
          payload.audience_poll = audience.payload_json.audience_poll;
        }

        const phone = lifelines.find(
          (l) =>
            l.lifeline_type === 'phone' &&
            l.payload_json?.session_question_id === current.session_question_id
        );
        if (phone?.payload_json?.suggestion_option_id) {
          payload.phone_suggestion_option_id = phone.payload_json.suggestion_option_id;
        }
        if (phone?.payload_json?.message) {
          payload.phone_message = phone.payload_json.message;
        }

        const total = Math.max(
          1,
          Number(payload.total_questions) || (Array.isArray(cached.questions) ? cached.questions.length : 15)
        );
        payload.prizes = MILLIONAIRE_PRIZES.slice(0, total);
      }

      return payload;
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    if (session.status && session.status !== 'in_progress') {
      throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
    }
    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    if (questions.length === 0) throw new AppError('No questions in session', 404, 'NOT_FOUND');

    const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
      questions.map((q) => q.id)
    );
    const answeredSet = new Set(answers.map((a) => a.session_question_id));
    const current = questions.find((q) => !answeredSet.has(q.id));
    if (!current) throw new AppError('No current question', 404, 'NO_CURRENT_QUESTION');

    const storyWrongCount =
      session.mode === 'story'
        ? (answers || []).filter((a) => a && a.is_correct === false).length
        : 0;

    const options = await this.sessionOptionRepository.listBySessionQuestionId(current.id);
    const payload = {
      session_question_id: current.id,
      mode: session.mode,
      question_number: current.order_index,
      total_questions: session.total_questions,
      question_text: current.question_text_snapshot,
      options: options.map((o) => ({
        id: o.id,
        label: LABELS[o.order_index - 1] || String(o.order_index),
        text: o.option_text_snapshot,
      })),
      score_total: session.score_total ?? 0,
    };

    if (session.mode === 'blitz') {
      const lastAnsweredAt = (answers || [])
        .map((a) => a?.answered_at)
        .filter(Boolean)
        .sort()
        .slice(-1)[0];
      const start = lastAnsweredAt || session.started_at;

      const strikes = (answers || []).filter((a) => a && a.is_correct === false).length;
      payload.time_limit_sec = BLITZ_TIME_LIMIT_SEC;
      payload.time_remaining_sec = computePerQuestionRemainingFromStartedAt(
        start,
        BLITZ_TIME_LIMIT_SEC
      );
      payload.strike_count = strikes;
      payload.strikes_remaining = Math.max(0, BLITZ_MAX_STRIKES - strikes);
    } else if (session.mode === 'story') {
      payload.time_remaining_sec = computeTimeRemainingSec(session);
    } else {
      payload.time_limit_sec = current.time_limit_snapshot;
    }

    if (session.mode === 'story') {
      payload.wrong_count = storyWrongCount;
      payload.strikes_remaining = Math.max(0, STORY_MAX_WRONG - storyWrongCount);
    }

    if (session.mode === 'millionaire') {
      const lifelines = await this.sessionLifelineRepository.listBySessionId(sessionId);
      payload.lifelines_used = lifelines.map((l) => l.lifeline_type);

      const fifty = lifelines.find(
        (l) =>
          l.lifeline_type === 'fifty_fifty' &&
          l.payload_json?.session_question_id === current.id
      );
      if (fifty?.payload_json?.disabled_option_ids) {
        payload.disabled_option_ids = fifty.payload_json.disabled_option_ids;
      }

      const audience = lifelines.find(
        (l) =>
          l.lifeline_type === 'audience' && l.payload_json?.session_question_id === current.id
      );
      if (audience?.payload_json?.audience_poll) {
        payload.audience_poll = audience.payload_json.audience_poll;
      }

      const phone = lifelines.find(
        (l) => l.lifeline_type === 'phone' && l.payload_json?.session_question_id === current.id
      );
      if (phone?.payload_json?.suggestion_option_id) {
        payload.phone_suggestion_option_id = phone.payload_json.suggestion_option_id;
      }
      if (phone?.payload_json?.message) {
        payload.phone_message = phone.payload_json.message;
      }

      payload.prizes = MILLIONAIRE_PRIZES.slice(0, Math.max(1, session.total_questions || 15));
    }

    return payload;
  }

  async submitAnswer(sessionId, userId, body) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode) {
      const isGuest = !!cached.is_guest;
      if (!isGuest) {
        if (!userId) throw new AppError('Missing Bearer token', 401, 'UNAUTHORIZED');
        if (cached.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
      }
      if (cached.status && cached.status !== 'in_progress') {
        throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
      }

      if (cached.mode === 'story') {
        const remaining = computeTimeRemainingFromStartedAt(cached.started_at);
        if (remaining != null && remaining <= 0) {
          cached.status = 'abandoned';
          sessionCache.set(sessionId, cached);
          if (!isGuest) {
            try {
              await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
            } catch {
              // ignore
            }
          }
          throw new AppError('Time is up', 409, 'TIME_UP');
        }
      }

      const idx = Math.max(0, Number(cached.current_index) || 0);
      const current = Array.isArray(cached.questions) ? cached.questions[idx] : null;
      if (!current) throw new AppError('No current question', 404, 'NO_CURRENT_QUESTION');

      if (String(body.session_question_id) !== String(current.session_question_id)) {
        throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');
      }

      const chosen = (current.options || []).find((o) => o.id === body.chosen_option_id);
      if (!chosen) throw new AppError('Invalid chosen_option_id', 400, 'INVALID_INPUT');

      const correctId =
        cached.correct_option_id_by_session_question_id?.[current.session_question_id] || null;
      const computedCorrect = correctId ? String(correctId) === String(body.chosen_option_id) : false;

      let is_correct = computedCorrect;
      let blitzTimedOut = false;
      if (cached.mode === 'blitz') {
        const start = cached.question_started_at || cached.started_at;
        const remaining = computePerQuestionRemainingFromStartedAt(start, BLITZ_TIME_LIMIT_SEC);
        const answeredInSec = Number(body.answered_in_sec);
        blitzTimedOut =
          (remaining != null && remaining <= 0) ||
          (Number.isFinite(answeredInSec) && answeredInSec >= BLITZ_TIME_LIMIT_SEC);
        if (blitzTimedOut) is_correct = false;
      }

      let storyStrikeOut = false;
      if (cached.mode === 'story' && !is_correct) {
        const nextWrong = (Number(cached.wrong_count) || 0) + 1;
        cached.wrong_count = nextWrong;
        storyStrikeOut = nextWrong >= STORY_MAX_WRONG;
      }

      if (isGuest) {
        if (!cached.answered_session_question_id_set) {
          cached.answered_session_question_id_set = new Set();
        }
        if (cached.answered_session_question_id_set.has(String(current.session_question_id))) {
          throw new AppError('Already answered', 409, 'CONFLICT');
        }
        cached.answered_session_question_id_set.add(String(current.session_question_id));
      } else {
        await this.sessionAnswerRepository.create({
          session_question_id: current.session_question_id,
          chosen_option_id: body.chosen_option_id,
          is_correct,
          answered_in_sec: body.answered_in_sec ?? null,
        });
      }

      if (cached.mode === 'blitz') {
        const strikes = Math.max(0, Number(cached.strike_count) || 0) + (is_correct ? 0 : 1);
        cached.strike_count = strikes;
        if (strikes >= BLITZ_MAX_STRIKES) {
          cached.status = 'abandoned';
          sessionCache.del(sessionId);
          if (!isGuest) {
            try {
              await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
            } catch {
              // ignore
            }
          }
          return {
            is_correct: false,
            chosen_option_id: body.chosen_option_id,
            correct_option_id: correctId,
            score_total: cached.score_total ?? 0,
            next_question_available: false,
            finished: true,
            status: 'abandoned',
            reason: 'strikes',
            strike_count: strikes,
            strikes_remaining: 0,
            timed_out: blitzTimedOut,
          };
        }
      }

      if (cached.mode === 'story' && storyStrikeOut) {
        cached.status = 'abandoned';
        sessionCache.set(sessionId, cached);
        if (!isGuest) {
          try {
            await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
          } catch {
            // ignore
          }
        }
        return {
          is_correct: false,
          chosen_option_id: body.chosen_option_id,
          correct_option_id: correctId,
          score_total: cached.score_total ?? 0,
          time_remaining_sec: computeTimeRemainingFromStartedAt(cached.started_at),
          next_question_available: false,
          finished: true,
          status: 'abandoned',
          reason: 'strikes',
          wrong_count: Math.max(0, Number(cached.wrong_count) || 0),
          strikes_remaining: 0,
        };
      }

      if (cached.mode === 'millionaire') {
        if (!is_correct) {
          cached.status = 'completed';
          sessionCache.set(sessionId, cached);
          return {
            is_correct: false,
            chosen_option_id: body.chosen_option_id,
            correct_option_id: correctId,
            current_prize: cached.score_total ?? 0,
            next_question_available: false,
            finished: true,
          };
        }

        const qIdx = Math.max(1, Number(current.question_number) || 1);
        const prize = MILLIONAIRE_PRIZES[qIdx - 1] ?? (cached.score_total ?? 0);
        if (!isGuest) {
          const updatedSession = await this.gameSessionRepository.setScore(sessionId, prize);
          cached.score_total = updatedSession?.score_total ?? prize;
        } else {
          cached.score_total = prize;
        }
        cached.current_index = idx + 1;

        const next = Array.isArray(cached.questions) ? cached.questions[cached.current_index] : null;
        const next_question_available = !!next;

        let next_question = null;
        if (next_question_available && next) {
          const lifelines = isGuest
            ? Array.isArray(cached.lifelines)
              ? cached.lifelines
              : []
            : await this.sessionLifelineRepository.listBySessionId(sessionId);
          next_question = {
            ...next,
            score_total: cached.score_total ?? prize,
            lifelines_used: lifelines.map((l) => l.lifeline_type),
            prizes: MILLIONAIRE_PRIZES.slice(
              0,
              Math.max(
                1,
                Number(next.total_questions) ||
                  (Array.isArray(cached.questions) ? cached.questions.length : 15)
              )
            ),
          };

          const fifty = lifelines.find(
            (l) =>
              l.lifeline_type === 'fifty_fifty' &&
              l.payload_json?.session_question_id === next.session_question_id
          );
          if (fifty?.payload_json?.disabled_option_ids) {
            next_question.disabled_option_ids = fifty.payload_json.disabled_option_ids;
          }

          const audience = lifelines.find(
            (l) =>
              l.lifeline_type === 'audience' &&
              l.payload_json?.session_question_id === next.session_question_id
          );
          if (audience?.payload_json?.audience_poll) {
            next_question.audience_poll = audience.payload_json.audience_poll;
          }

          const phone = lifelines.find(
            (l) =>
              l.lifeline_type === 'phone' &&
              l.payload_json?.session_question_id === next.session_question_id
          );
          if (phone?.payload_json?.suggestion_option_id) {
            next_question.phone_suggestion_option_id = phone.payload_json.suggestion_option_id;
          }
          if (phone?.payload_json?.message) {
            next_question.phone_message = phone.payload_json.message;
          }
        }

        sessionCache.set(sessionId, cached);
        return {
          is_correct: true,
          chosen_option_id: body.chosen_option_id,
          correct_option_id: correctId,
          current_prize: cached.score_total ?? prize,
          next_question_available,
          ...(next_question ? { next_question } : {}),
        };
      }

      let scoreDelta = 0;
      if (is_correct) {
        scoreDelta = cached.mode === 'blitz' ? 1 : Number(current.points) || 0;
      }

      let speed_bonus = 0;
      if (is_correct && cached.mode === 'custom') {
        const timeLimit = Number(current.time_limit_sec ?? 30);
        const answered = Number(body.answered_in_sec);
        if (Number.isFinite(timeLimit) && Number.isFinite(answered)) {
          speed_bonus = Math.max(0, Math.floor(timeLimit - answered));
        }
        scoreDelta += speed_bonus;
      }

      if (!isGuest) {
        const updatedSession = await this.gameSessionRepository.addScore(sessionId, scoreDelta);
        cached.score_total = updatedSession?.score_total ?? cached.score_total ?? 0;
      } else {
        cached.score_total = (Number(cached.score_total) || 0) + scoreDelta;
      }
      cached.current_index = idx + 1;
      if (cached.mode === 'blitz') {
        cached.question_started_at = new Date().toISOString();
      }

      const next = Array.isArray(cached.questions) ? cached.questions[cached.current_index] : null;
      const next_question_available = !!next;

      sessionCache.set(sessionId, cached);

      const base = {
        is_correct,
        chosen_option_id: body.chosen_option_id,
        correct_option_id: correctId,
        score_total: cached.score_total ?? 0,
        next_question_available,
        ...(next ? { next_question: { ...next, score_total: cached.score_total ?? 0 } } : {}),
        ...(cached.mode === 'custom' ? { speed_bonus } : {}),
      };

      if (cached.mode === 'blitz') {
        const startedAt = cached.question_started_at || cached.started_at;
        base.time_remaining_sec = computePerQuestionRemainingFromStartedAt(
          startedAt,
          BLITZ_TIME_LIMIT_SEC
        );
        const strikes = Math.max(0, Number(cached.strike_count) || 0);
        base.strike_count = strikes;
        base.strikes_remaining = Math.max(0, BLITZ_MAX_STRIKES - strikes);
        base.timed_out = !!blitzTimedOut;
        if (base.next_question) {
          base.next_question.time_remaining_sec = BLITZ_TIME_LIMIT_SEC;
          base.next_question.strike_count = strikes;
          base.next_question.strikes_remaining = base.strikes_remaining;
        }
      } else if (cached.mode === 'story') {
        base.time_remaining_sec = computeTimeRemainingFromStartedAt(cached.started_at);
        if (base.next_question) {
          base.next_question.time_remaining_sec = computeTimeRemainingFromStartedAt(cached.started_at);
        }
      }

      if (cached.mode === 'story') {
        const wrong = Math.max(0, Number(cached.wrong_count) || 0);
        base.wrong_count = wrong;
        base.strikes_remaining = Math.max(0, STORY_MAX_WRONG - wrong);
        if (base.next_question) {
          base.next_question.wrong_count = wrong;
          base.next_question.strikes_remaining = base.strikes_remaining;
        }
      }

      return base;
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    if (session.status && session.status !== 'in_progress') {
      throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
    }

    if (session.mode === 'story') {
      const remaining = computeTimeRemainingSec(session);
      if (remaining != null && remaining <= 0) {
        try {
          await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
        } catch {
          // ignore
        }
        sessionCache.del(sessionId);
        throw new AppError('Time is up', 409, 'TIME_UP');
      }
    }

    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    const sessionQuestion = questions.find((q) => q.id === body.session_question_id);
    if (!sessionQuestion) throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

    const existing = await this.sessionAnswerRepository.findBySessionQuestionId(sessionQuestion.id);
    if (existing) throw new AppError('Already answered', 409, 'CONFLICT');

    const answersBefore = await this.sessionAnswerRepository.listBySessionQuestionIds(
      questions.map((q) => q.id)
    );

    const options = await this.sessionOptionRepository.listBySessionQuestionId(sessionQuestion.id);
    const chosen = options.find((o) => o.id === body.chosen_option_id);
    if (!chosen) throw new AppError('Invalid chosen_option_id', 400, 'INVALID_INPUT');

    const correctOptionId = options.find((o) => !!o.is_correct_snapshot)?.id || null;

    let is_correct = !!chosen.is_correct_snapshot;
    let blitzTimedOut = false;
    if (session.mode === 'blitz') {
      const lastAnsweredAt = (answersBefore || [])
        .map((a) => a?.answered_at)
        .filter(Boolean)
        .sort()
        .slice(-1)[0];
      const start = lastAnsweredAt || session.started_at;
      const remaining = computePerQuestionRemainingFromStartedAt(start, BLITZ_TIME_LIMIT_SEC);
      const answeredInSec = Number(body.answered_in_sec);
      blitzTimedOut =
        (remaining != null && remaining <= 0) ||
        (Number.isFinite(answeredInSec) && answeredInSec >= BLITZ_TIME_LIMIT_SEC);
      if (blitzTimedOut) is_correct = false;
    }

    const createdAnswer = await this.sessionAnswerRepository.create({
      session_question_id: sessionQuestion.id,
      chosen_option_id: chosen.id,
      is_correct,
      answered_in_sec: body.answered_in_sec ?? null,
    });

    if (session.mode === 'blitz') {
      const strikesBefore = (answersBefore || []).filter((a) => a && a.is_correct === false).length;
      const strikes = strikesBefore + (is_correct ? 0 : 1);

      if (strikes >= BLITZ_MAX_STRIKES) {
        await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
        sessionCache.del(sessionId);
        return {
          is_correct: false,
          chosen_option_id: chosen.id,
          correct_option_id: correctOptionId,
          score_total: session.score_total ?? 0,
          time_remaining_sec: 0,
          next_question_available: false,
          finished: true,
          status: 'abandoned',
          reason: 'strikes',
          strike_count: strikes,
          strikes_remaining: 0,
          timed_out: blitzTimedOut,
        };
      }

      const scoreDelta = is_correct ? 1 : 0;
      const updatedSession = scoreDelta
        ? await this.gameSessionRepository.addScore(sessionId, scoreDelta)
        : session;

      const answers = [...(answersBefore || []), createdAnswer].filter(Boolean);
      const answeredSet = new Set(answers.map((a) => a.session_question_id));
      const next = questions.find((q) => !answeredSet.has(q.id)) || null;
      const next_question_available = !!next;

      let next_question = null;
      if (next) {
        const nextOptions = await this.sessionOptionRepository.listBySessionQuestionId(next.id);
        next_question = {
          session_question_id: next.id,
          mode: session.mode,
          question_number: next.order_index,
          total_questions: session.total_questions,
          question_text: next.question_text_snapshot,
          options: nextOptions.map((o) => ({
            id: o.id,
            label: LABELS[o.order_index - 1] || String(o.order_index),
            text: o.option_text_snapshot,
          })),
          score_total: updatedSession?.score_total ?? session.score_total ?? 0,
          time_limit_sec: BLITZ_TIME_LIMIT_SEC,
          time_remaining_sec: BLITZ_TIME_LIMIT_SEC,
          strike_count: strikes,
          strikes_remaining: Math.max(0, BLITZ_MAX_STRIKES - strikes),
        };
      }

      return {
        is_correct,
        chosen_option_id: chosen.id,
        correct_option_id: correctOptionId,
        score_total: updatedSession?.score_total ?? session.score_total,
        time_limit_sec: BLITZ_TIME_LIMIT_SEC,
        time_remaining_sec: BLITZ_TIME_LIMIT_SEC,
        strike_count: strikes,
        strikes_remaining: Math.max(0, BLITZ_MAX_STRIKES - strikes),
        timed_out: blitzTimedOut,
        next_question_available,
        ...(next_question ? { next_question } : {}),
      };
    }

    if (session.mode === 'millionaire') {
      if (!is_correct) {
        await this.gameSessionRepository.updateStatus(sessionId, 'completed');
        return {
          is_correct: false,
          chosen_option_id: chosen.id,
          correct_option_id: correctOptionId,
          current_prize: session.score_total ?? 0,
          next_question_available: false,
          finished: true,
        };
      }

      const qIdx = Math.max(1, Number(sessionQuestion.order_index) || 1);
      const prize = MILLIONAIRE_PRIZES[qIdx - 1] ?? (session.score_total ?? 0);
      const updatedSession = await this.gameSessionRepository.setScore(sessionId, prize);

      const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
        questions.map((q) => q.id)
      );
      const next_question_available = answers.length < questions.length;
      let next_question = null;
      if (next_question_available) {
        const answeredSet = new Set(answers.map((a) => a.session_question_id));
        const next = questions.find((q) => !answeredSet.has(q.id)) || null;
        if (next) {
          const nextOptions = await this.sessionOptionRepository.listBySessionQuestionId(next.id);
          const lifelines = await this.sessionLifelineRepository.listBySessionId(sessionId);

          next_question = {
            session_question_id: next.id,
            mode: session.mode,
            question_number: next.order_index,
            total_questions: session.total_questions,
            question_text: next.question_text_snapshot,
            options: nextOptions.map((o) => ({
              id: o.id,
              label: LABELS[o.order_index - 1] || String(o.order_index),
              text: o.option_text_snapshot,
            })),
            score_total: updatedSession?.score_total ?? prize,
            time_limit_sec: next.time_limit_snapshot,
            lifelines_used: lifelines.map((l) => l.lifeline_type),
            prizes: MILLIONAIRE_PRIZES.slice(0, Math.max(1, session.total_questions || 15)),
          };

          const fifty = lifelines.find(
            (l) => l.lifeline_type === 'fifty_fifty' && l.payload_json?.session_question_id === next.id
          );
          if (fifty?.payload_json?.disabled_option_ids) {
            next_question.disabled_option_ids = fifty.payload_json.disabled_option_ids;
          }

          const audience = lifelines.find(
            (l) => l.lifeline_type === 'audience' && l.payload_json?.session_question_id === next.id
          );
          if (audience?.payload_json?.audience_poll) {
            next_question.audience_poll = audience.payload_json.audience_poll;
          }

          const phone = lifelines.find(
            (l) => l.lifeline_type === 'phone' && l.payload_json?.session_question_id === next.id
          );
          if (phone?.payload_json?.suggestion_option_id) {
            next_question.phone_suggestion_option_id = phone.payload_json.suggestion_option_id;
          }
          if (phone?.payload_json?.message) {
            next_question.phone_message = phone.payload_json.message;
          }
        }
      }
      return {
        is_correct: true,
        chosen_option_id: chosen.id,
        correct_option_id: correctOptionId,
        current_prize: updatedSession?.score_total ?? prize,
        next_question_available,
        ...(next_question ? { next_question } : {}),
      };
    }

    let scoreDelta = 0;
    if (is_correct) {
      if (session.mode === 'blitz') scoreDelta = 1;
      else scoreDelta = sessionQuestion.points_snapshot ?? 0;
    }

    let speed_bonus = 0;
    if (is_correct && session.mode === 'custom') {
      const timeLimit = Number(sessionQuestion.time_limit_snapshot ?? 30);
      const answered = Number(body.answered_in_sec);
      if (Number.isFinite(timeLimit) && Number.isFinite(answered)) {
        speed_bonus = Math.max(0, Math.floor(timeLimit - answered));
      }
      scoreDelta += speed_bonus;
    }

    const updatedSession = await this.gameSessionRepository.addScore(sessionId, scoreDelta);
    const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
      questions.map((q) => q.id)
    );

    const storyWrongCount =
      session.mode === 'story'
        ? (answers || []).filter((a) => a && a.is_correct === false).length
        : 0;

    if (session.mode === 'story' && storyWrongCount >= STORY_MAX_WRONG) {
      await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
      sessionCache.del(sessionId);
      return {
        is_correct,
        score_total: updatedSession?.score_total ?? session.score_total,
        time_remaining_sec: computeTimeRemainingSec(updatedSession || session),
        next_question_available: false,
        finished: true,
        status: 'abandoned',
        reason: 'strikes',
        wrong_count: storyWrongCount,
        strikes_remaining: 0,
      };
    }

    const next_question_available = answers.length < questions.length;

    if (session.mode === 'blitz') {
      let next_question = null;
      if (next_question_available) {
        const answeredSet = new Set(answers.map((a) => a.session_question_id));
        const next = questions.find((q) => !answeredSet.has(q.id)) || null;
        if (next) {
          const nextOptions = await this.sessionOptionRepository.listBySessionQuestionId(next.id);
          next_question = {
            session_question_id: next.id,
            mode: session.mode,
            question_number: next.order_index,
            total_questions: session.total_questions,
            question_text: next.question_text_snapshot,
            options: nextOptions.map((o) => ({
              id: o.id,
              label: LABELS[o.order_index - 1] || String(o.order_index),
              text: o.option_text_snapshot,
            })),
            score_total: updatedSession?.score_total ?? session.score_total ?? 0,
            time_remaining_sec: computeTimeRemainingSec(updatedSession || session),
          };
        }
      }
      return {
        is_correct,
        score_total: updatedSession?.score_total ?? session.score_total,
        time_remaining_sec: computeTimeRemainingSec(updatedSession || session),
        next_question_available,
        ...(next_question ? { next_question } : {}),
      };
    }

    let next_question = null;
    if (next_question_available) {
      const answeredSet = new Set(answers.map((a) => a.session_question_id));
      const next = questions.find((q) => !answeredSet.has(q.id)) || null;
      if (next) {
        const nextOptions = await this.sessionOptionRepository.listBySessionQuestionId(next.id);
        next_question = {
          session_question_id: next.id,
          mode: session.mode,
          question_number: next.order_index,
          total_questions: session.total_questions,
          question_text: next.question_text_snapshot,
          options: nextOptions.map((o) => ({
            id: o.id,
            label: LABELS[o.order_index - 1] || String(o.order_index),
            text: o.option_text_snapshot,
          })),
          score_total: updatedSession?.score_total ?? session.score_total ?? 0,
          time_limit_sec: next.time_limit_snapshot,
        };

        if (session.mode === 'story') {
          next_question.time_remaining_sec = computeTimeRemainingSec(updatedSession || session);
          next_question.wrong_count = storyWrongCount;
          next_question.strikes_remaining = Math.max(0, STORY_MAX_WRONG - storyWrongCount);
        }
      }
    }

    return {
      is_correct,
      chosen_option_id: chosen.id,
      correct_option_id: correctOptionId,
      score_total: updatedSession?.score_total ?? session.score_total,
      next_question_available,
      ...(next_question ? { next_question } : {}),
      ...(session.mode === 'custom' ? { speed_bonus } : {}),
      ...(session.mode === 'story'
        ? {
            time_remaining_sec: computeTimeRemainingSec(updatedSession || session),
            wrong_count: storyWrongCount,
            strikes_remaining: Math.max(0, STORY_MAX_WRONG - storyWrongCount),
          }
        : {}),
    };
  }

  async useLifeline(sessionId, userId, body) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode && cached.mode === 'millionaire' && cached.is_guest) {
      if (cached.status && cached.status !== 'in_progress') {
        throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
      }

      const used = Array.isArray(cached.lifelines) ? cached.lifelines : [];
      if (used.find((l) => l.lifeline_type === body.lifeline_type)) {
        throw new AppError('Lifeline already used', 409, 'CONFLICT');
      }

      const idx = Math.max(0, Number(cached.current_index) || 0);
      const current = Array.isArray(cached.questions) ? cached.questions[idx] : null;
      if (!current) throw new AppError('No current question', 404, 'NO_CURRENT_QUESTION');
      if (String(body.session_question_id) !== String(current.session_question_id)) {
        throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');
      }

      const options = Array.isArray(current.options) ? current.options : [];
      if (options.length === 0) throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

      const correctId =
        cached.correct_option_id_by_session_question_id?.[current.session_question_id] || null;

      let payload = {};
      if (body.lifeline_type === 'fifty_fifty') {
        const incorrect = options.filter((o) => String(o.id) !== String(correctId));
        const disabled = [];
        while (disabled.length < Math.min(2, incorrect.length)) {
          const pick = incorrect[Math.floor(Math.random() * incorrect.length)];
          if (pick?.id && !disabled.includes(pick.id)) disabled.push(pick.id);
        }
        payload = {
          session_question_id: body.session_question_id,
          disabled_option_ids: disabled,
        };
      } else if (body.lifeline_type === 'audience') {
        // Reuse the existing poll generator by shaping option objects.
        const shaped = options.map((o) => ({
          id: o.id,
          is_correct_snapshot: String(o.id) === String(correctId),
        }));
        payload = {
          session_question_id: body.session_question_id,
          audience_poll: buildAudiencePoll(shaped),
        };
      } else if (body.lifeline_type === 'phone') {
        const shaped = options.map((o) => ({
          id: o.id,
          is_correct_snapshot: String(o.id) === String(correctId),
        }));
        const suggestion = pickPhoneSuggestion(shaped);
        const suggested = options.find((o) => String(o.id) === String(suggestion));
        payload = {
          session_question_id: body.session_question_id,
          suggestion_option_id: suggestion,
          message: suggested ? `I think it's option ${suggested.label || ''}.` : `I'm not sure...`,
        };
      } else if (body.lifeline_type === 'skip') {
        payload = { session_question_id: body.session_question_id };
      }

      cached.lifelines = [...used, { lifeline_type: body.lifeline_type, payload_json: payload }];

      if (body.lifeline_type === 'skip') {
        if (!cached.answered_session_question_id_set) cached.answered_session_question_id_set = new Set();
        cached.answered_session_question_id_set.add(String(current.session_question_id));
        cached.current_index = idx + 1;
        sessionCache.set(sessionId, cached);
        const next = Array.isArray(cached.questions) ? cached.questions[cached.current_index] : null;
        return {
          lifeline_type: 'skip',
          skipped: true,
          next_question_available: !!next,
        };
      }

      sessionCache.set(sessionId, cached);

      if (body.lifeline_type === 'fifty_fifty') {
        return { lifeline_type: 'fifty_fifty', disabled_option_ids: payload.disabled_option_ids };
      }
      if (body.lifeline_type === 'phone') {
        return {
          lifeline_type: 'phone',
          suggestion_option_id: payload.suggestion_option_id,
          message: payload.message,
        };
      }
      return { lifeline_type: body.lifeline_type, ...payload };
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    if (session.mode !== 'millionaire') {
      throw new AppError('Lifelines are only available in millionaire mode', 400, 'INVALID_INPUT');
    }

    const existing = await this.sessionLifelineRepository.findBySessionAndType(
      sessionId,
      body.lifeline_type
    );
    if (existing) throw new AppError('Lifeline already used', 409, 'CONFLICT');

    const options = await this.sessionOptionRepository.listBySessionQuestionId(
      body.session_question_id
    );
    if (options.length === 0) throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

    let payload = {};
    if (body.lifeline_type === 'fifty_fifty') {
      const incorrect = options.filter((o) => !o.is_correct_snapshot);
      const disabled = [];
      while (disabled.length < Math.min(2, incorrect.length)) {
        const pick = incorrect[Math.floor(Math.random() * incorrect.length)];
        if (!disabled.includes(pick.id)) disabled.push(pick.id);
      }
      payload = {
        session_question_id: body.session_question_id,
        disabled_option_ids: disabled,
      };
    } else if (body.lifeline_type === 'audience') {
      payload = {
        session_question_id: body.session_question_id,
        audience_poll: buildAudiencePoll(options),
      };
    } else if (body.lifeline_type === 'phone') {
      const suggestion = pickPhoneSuggestion(options);
      const suggested = options.find((o) => o.id === suggestion);
      payload = {
        session_question_id: body.session_question_id,
        suggestion_option_id: suggestion,
        message: suggested ? `I think it's option ${LABELS[suggested.order_index - 1] || ''}.` : `I'm not sure...`,
      };
    } else if (body.lifeline_type === 'skip') {
      payload = { session_question_id: body.session_question_id };
    }

    await this.sessionLifelineRepository.create({
      session_id: sessionId,
      lifeline_type: body.lifeline_type,
      payload_json: payload,
    });

    if (body.lifeline_type === 'fifty_fifty') {
      return {
        lifeline_type: 'fifty_fifty',
        disabled_option_ids: payload.disabled_option_ids,
      };
    }

    if (body.lifeline_type === 'phone') {
      return {
        lifeline_type: 'phone',
        suggestion_option_id: payload.suggestion_option_id,
        message: payload.message,
      };
    }

    if (body.lifeline_type === 'skip') {
      const existingAnswer = await this.sessionAnswerRepository.findBySessionQuestionId(
        body.session_question_id
      );
      if (!existingAnswer) {
        const firstOption = options[0];
        await this.sessionAnswerRepository.create({
          session_question_id: body.session_question_id,
          chosen_option_id: firstOption.id,
          is_correct: false,
          answered_in_sec: 0,
        });
      }

      const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
      const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
        questions.map((q) => q.id)
      );
      const next_question_available = answers.length < questions.length;

      // Keep cache in sync so /current advances when sessionCache is being used.
      const c = sessionCache.get(sessionId);
      if (c?.mode === 'millionaire' && c.user_id === userId && Number.isFinite(Number(c.current_index))) {
        c.current_index = Math.max(0, Number(c.current_index) || 0) + 1;
        sessionCache.set(sessionId, c);
      }

      return { lifeline_type: 'skip', skipped: true, next_question_available };
    }

    return { lifeline_type: body.lifeline_type, ...payload };
  }

  async finish(sessionId, userId, status) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode && cached.is_guest) {
      cached.status = status;
      sessionCache.del(sessionId);
      return { status };
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    const updated = await this.gameSessionRepository.updateStatus(sessionId, status);
    if (!updated) throw new AppError('Session not found', 404, 'NOT_FOUND');

    const warnings = [];

    let storyXpEligible = false;
    let storyXpValue = 0;

    if (session.mode === 'story' && status === 'completed') {
      if (
        this.storySessionRepository &&
        this.storyLevelRepository &&
        this.userStoryProgressRepository
      ) {
        try {
          const meta = await this.storySessionRepository.findBySessionId(sessionId);
          if (meta?.level_id) {
            const level = await this.storyLevelRepository.findById(meta.level_id);
            if (level?.id) {
              const existing = await this.userStoryProgressRepository.findByUserAndLevelId(
                session.user_id,
                level.id
              );
              const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
              const maxScore = questions.reduce(
                (acc, q) => acc + (Number(q.points_snapshot) || 0),
                0
              );
              const scoreTotal = Number(updated.score_total) || 0;
              const { passed, stars } = computeStars({
                scoreTotal,
                maxScore,
                passScoreMin: level.pass_score_min ?? null,
              });

              const noStrike = maxScore > 0 ? scoreTotal >= maxScore : passed;
              const alreadyPerfect = maxScore > 0 ? (existing?.best_score ?? 0) >= maxScore : false;
              storyXpEligible = Boolean(passed && noStrike && !alreadyPerfect);
              storyXpValue = scoreTotal;

              await this.userStoryProgressRepository.upsertResult(session.user_id, level.id, {
                score_total: scoreTotal,
                stars_earned: stars,
                is_completed: passed,
              });

              if (passed && meta.level_number) {
                const next = await this.storyLevelRepository.findByLevelNumber(
                  Number(meta.level_number) + 1
                );
                if (next?.id) {
                  await this.userStoryProgressRepository.ensureUnlocked(session.user_id, next.id);
                }
              }
            }
          }
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED') throw err;
          // If story_sessions isn't configured, gameplay still works but progress unlock won't persist.
        }
      }
    }

    if (session.mode === 'custom' && session.quiz_id && status === 'completed') {
      try {
        await this.quizScoreRepository.upsertBest({
          quiz_id: session.quiz_id,
          user_id: session.user_id,
          score_value: updated.score_total ?? 0,
        });
      } catch (err) {
        if (err?.code === 'NOT_CONFIGURED' || err?.code === 'DB_SCHEMA_MISMATCH') {
          warnings.push({ code: err.code, message: err.message });
        } else {
          throw err;
        }
      }
    }

    if (status === 'completed') {
      let modeForLeaderboard = session.mode;
      if (session.mode === 'blitz') {
        modeForLeaderboard = session.difficulty === 'hard' ? 'blitz_hard' : null;
      }

      if (modeForLeaderboard) {
        await this.leaderboardRepository.insertFromSession({
          user_id: session.user_id,
          mode: modeForLeaderboard,
          score_value: updated.score_total ?? 0,
        });
      }

      await this.leaderboardRepository.insertFromSession({
        user_id: session.user_id,
        mode: 'global',
        score_value: updated.score_total ?? 0,
      });
    }

    let xpDelta = 0;

    if (status === 'completed') {
      if (session.mode === 'classic') {
        xpDelta = Number(updated.score_total) || 0;
      } else if (session.mode === 'story') {
        xpDelta = storyXpEligible ? Number(storyXpValue) || 0 : 0;
      } else if (session.mode === 'custom' && session.quiz_id) {
        const score = Number(updated.score_total) || 0;
        if (score > 0 && this.quizRatingRepository?.listByQuizId) {
          try {
            const rows = await this.quizRatingRepository.listByQuizId(session.quiz_id);
            const sum = (rows || []).reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
            const count = Array.isArray(rows) ? rows.length : 0;
            const avg = count ? Math.round((sum / count) * 100) / 100 : 0;

            if (count > 100 && avg > 3) xpDelta = score;
          } catch (err) {
            // If ratings table isn't configured, XP condition can't be met.
            if (err?.code !== 'NOT_CONFIGURED') throw err;
          }
        }
      }
    }

    if (xpDelta > 0) {
      await this.userStatsRepository.addXp(session.user_id, xpDelta);
    }

    sessionCache.del(sessionId);
    return {
      status: updated.status,
      session: {
        id: sessionId,
        mode: session.mode,
        quiz_id: session.quiz_id ?? null,
        difficulty: session.difficulty ?? null,
        score_total: updated.score_total ?? null,
      },
      warnings,
    };
  }
}
