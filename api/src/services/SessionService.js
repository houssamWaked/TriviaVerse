/**
 * Shared session gameplay service.
 */
import AppError from '../utils/AppError.js';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function computeTimeRemainingSec(session) {
  if (!session?.started_at) return null;
  const started = new Date(session.started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, 60 - elapsed);
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
  }) {
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.sessionAnswerRepository = sessionAnswerRepository;
    this.sessionLifelineRepository = sessionLifelineRepository;
    this.leaderboardRepository = leaderboardRepository;
    this.userStatsRepository = userStatsRepository;
    this.quizScoreRepository = quizScoreRepository;
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
      question_number: current.order_index,
      total_questions: session.total_questions,
      question_text: current.question_text_snapshot,
      options: options.map((o) => ({
        id: o.id,
        label: LABELS[o.order_index - 1] || String(o.order_index),
        text: o.option_text_snapshot,
      })),
    };

    if (session.mode === 'blitz') {
      payload.time_remaining_sec = computeTimeRemainingSec(session);
    } else {
      payload.time_limit_sec = current.time_limit_snapshot;
    }

    return payload;
  }

  async submitAnswer(sessionId, userId, body) {
    const session = await this.assertSessionOwner(sessionId, userId);
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

    if (session.mode === 'millionaire') {
      return {
        is_correct,
        current_prize: updatedSession?.score_total ?? session.score_total,
        next_question_available,
      };
    }

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
      payload = { session_question_id: body.session_question_id, hint: 'audience_poll' };
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

    return { lifeline_type: body.lifeline_type, ...payload };
  }

  async finish(sessionId, userId, status) {
    const session = await this.assertSessionOwner(sessionId, userId);
    const updated = await this.gameSessionRepository.updateStatus(sessionId, status);
    if (!updated) throw new AppError('Session not found', 404, 'NOT_FOUND');

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
