/**
 * Shared session gameplay service.
 */
import AppError from '../utils/AppError.js';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MILLIONAIRE_PRIZES = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000,
  500000, 1000000,
];

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
    this.storyLevelRepository = storyLevelRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
    this.storySessionRepository = storySessionRepository;
  }

  async assertSessionOwner(sessionId, userId) {
    const session = await this.gameSessionRepository.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return session;
  }

  async getCurrent(sessionId, userId) {
    const session = await this.assertSessionOwner(sessionId, userId);
    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    if (questions.length === 0) throw new AppError('No questions in session', 404, 'NOT_FOUND');

    const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
      questions.map((q) => q.id)
    );
    const answeredSet = new Set(answers.map((a) => a.session_question_id));
    const current = questions.find((q) => !answeredSet.has(q.id));
    if (!current) throw new AppError('No current question', 404, 'NO_CURRENT_QUESTION');

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
      payload.time_remaining_sec = computeTimeRemainingSec(session);
    } else {
      payload.time_limit_sec = current.time_limit_snapshot;
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
    const session = await this.assertSessionOwner(sessionId, userId);

    if (session.mode === 'blitz') {
      const remaining = computeTimeRemainingSec(session);
      if (remaining != null && remaining <= 0) {
        throw new AppError('Time is up', 409, 'TIME_UP');
      }
    }

    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    const sessionQuestion = questions.find((q) => q.id === body.session_question_id);
    if (!sessionQuestion) throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

    const existing = await this.sessionAnswerRepository.findBySessionQuestionId(sessionQuestion.id);
    if (existing) throw new AppError('Already answered', 409, 'CONFLICT');

    const options = await this.sessionOptionRepository.listBySessionQuestionId(sessionQuestion.id);
    const chosen = options.find((o) => o.id === body.chosen_option_id);
    if (!chosen) throw new AppError('Invalid chosen_option_id', 400, 'INVALID_INPUT');

    const is_correct = !!chosen.is_correct_snapshot;
    await this.sessionAnswerRepository.create({
      session_question_id: sessionQuestion.id,
      chosen_option_id: chosen.id,
      is_correct,
      answered_in_sec: body.answered_in_sec ?? null,
    });

    if (session.mode === 'millionaire') {
      if (!is_correct) {
        await this.gameSessionRepository.updateStatus(sessionId, 'completed');
        return {
          is_correct: false,
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
      return {
        is_correct: true,
        current_prize: updatedSession?.score_total ?? prize,
        next_question_available,
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
    const next_question_available = answers.length < questions.length;

    if (session.mode === 'blitz') {
      return {
        is_correct,
        score_total: updatedSession?.score_total ?? session.score_total,
        time_remaining_sec: computeTimeRemainingSec(updatedSession || session),
        next_question_available,
      };
    }

    return {
      is_correct,
      score_total: updatedSession?.score_total ?? session.score_total,
      next_question_available,
      ...(session.mode === 'custom' ? { speed_bonus } : {}),
    };
  }

  async useLifeline(sessionId, userId, body) {
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

      return { lifeline_type: 'skip', skipped: true, next_question_available };
    }

    return { lifeline_type: body.lifeline_type, ...payload };
  }

  async finish(sessionId, userId, status) {
    const session = await this.assertSessionOwner(sessionId, userId);
    const updated = await this.gameSessionRepository.updateStatus(sessionId, status);
    if (!updated) throw new AppError('Session not found', 404, 'NOT_FOUND');

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
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    await this.leaderboardRepository.insertFromSession({
      user_id: session.user_id,
      mode: session.mode,
      score_value: updated.score_total ?? 0,
    });
    await this.leaderboardRepository.insertFromSession({
      user_id: session.user_id,
      mode: 'global',
      score_value: updated.score_total ?? 0,
    });

    await this.userStatsRepository.addXp(session.user_id, updated.score_total ?? 0);

    return { status: updated.status };
  }
}
