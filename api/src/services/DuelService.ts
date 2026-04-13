/**
 * Duel service (async 1v1 challenges).
 *
 * Rules:
 * - Supports:
 *   - Custom quiz duels (mode = 'custom')
 *   - Blitz duels (mode = 'blitz', fixed question set)
 * - Winner is decided by:
 *   1) number of correct answers (higher wins)
 *   2) total answer time in seconds (lower wins)
 */
import AppError from '../utils/AppError.js';

type PerformanceSummary = {
  correct_count: number;
  total_time_sec: number;
};

function asId(x: unknown): string {
  return String(x || '').trim();
}

function isoNow(): string {
  return new Date().toISOString();
}

function safeNum(n: unknown, fallback = 0): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return x;
}

function msUntil(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, t - Date.now());
}

function computeWinner({
  challenger,
  opponent,
}: {
  challenger: PerformanceSummary;
  opponent: PerformanceSummary;
}) {
  if (challenger.correct_count > opponent.correct_count) return 'challenger';
  if (challenger.correct_count < opponent.correct_count) return 'opponent';

  if (challenger.total_time_sec < opponent.total_time_sec) return 'challenger';
  if (challenger.total_time_sec > opponent.total_time_sec) return 'opponent';

  return 'tie';
}

export class DuelService {
  private duelRepository: any;
  private duelAnswerRepository: any;
  private duelClaimRepository: any;
  private friendRepository: any;
  private userRepository: any;
  private quizRepository: any;
  private gameSessionRepository: any;
  private sessionQuestionRepository: any;
  private sessionOptionRepository: any;
  private sessionAnswerRepository: any;
  private sessionStartService: any;

  /**
   * Construct the duel service.
   * @param duelRepository Duel persistence and updates.
   * @param duelAnswerRepository Live duel answer persistence.
   * @param duelClaimRepository Claim/first-correct tracking.
   * @param friendRepository Friendship checks for authorization.
   * @param userRepository User lookups for display decoration.
   * @param quizRepository Quiz lookups for custom duels.
   * @param gameSessionRepository Session lookups for async/custom duel resolution.
   * @param sessionQuestionRepository Snapshot questions used by blitz duels.
   * @param sessionOptionRepository Snapshot options used by blitz duels.
   * @param sessionAnswerRepository Session answers used for custom duel resolution.
   * @param sessionStartService Session creation for duels.
   * @returns A `DuelService` instance.
   */
  constructor({
    duelRepository,
    duelAnswerRepository,
    duelClaimRepository,
    friendRepository,
    userRepository,
    quizRepository,
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    sessionAnswerRepository,
    sessionStartService,
  }) {
    this.duelRepository = duelRepository;
    this.duelAnswerRepository = duelAnswerRepository;
    this.duelClaimRepository = duelClaimRepository;
    this.friendRepository = friendRepository;
    this.userRepository = userRepository;
    this.quizRepository = quizRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.sessionAnswerRepository = sessionAnswerRepository;
    this.sessionStartService = sessionStartService;
  }

  /**
   * Create a duel challenge for a friend (custom quiz or blitz duel).
   * @param userId Challenger user id.
   * @param friend_user_id Opponent user id.
   * @param quiz_id Quiz id for custom duels.
   * @param mode Duel mode (`custom` or `blitz`).
   * @param difficulty Optional blitz difficulty label.
   * @param category_id Optional blitz category selection.
   * @returns Decorated duel entry for the challenger.
   */
  async createChallenge(
    userId: string,
    {
      friend_user_id,
      quiz_id,
      mode,
      difficulty,
      category_id,
    }: {
      friend_user_id: string;
      quiz_id?: string | null;
      mode?: string | null;
      difficulty?: string | null;
      category_id?: string | null;
    }
  ) {
    const opponentUserId = asId(friend_user_id);
    const quizId = asId(quiz_id);
    const duelMode = String(mode || 'custom')
      .trim()
      .toLowerCase();
    if (!opponentUserId) throw new AppError('Invalid friend_user_id', 400, 'INVALID_INPUT');
    if (duelMode !== 'custom' && duelMode !== 'blitz') {
      throw new AppError('Invalid mode', 400, 'INVALID_INPUT');
    }
    if (duelMode === 'custom' && !quizId)
      throw new AppError('Invalid quiz_id', 400, 'INVALID_INPUT');
    if (opponentUserId === userId) {
      throw new AppError('Cannot challenge yourself', 400, 'INVALID_INPUT');
    }

    const ok = await this.friendRepository.areFriends(userId, opponentUserId);
    if (!ok) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    let quiz = null;
    let challenger_session_id = null;
    let duelPayload = null;

    if (duelMode === 'custom') {
      quiz = await this.quizRepository.findById(quizId);
      if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
      if (quiz.status !== 'published') {
        throw new AppError('Quiz must be published for duels', 400, 'INVALID_INPUT');
      }

      const start = await this.sessionStartService.startCustomQuizSession(userId, quizId);
      challenger_session_id = start.session_id;

      duelPayload = {
        quiz_id: quizId,
        challenger_user_id: userId,
        opponent_user_id: opponentUserId,
        challenger_session_id,
        status: 'pending',
        current_index: 1,
        challenger_points: 0,
        opponent_points: 0,
        summary_json: {},
      };
    } else {
      // Blitz duels: create a fixed question set by snapshotting a short blitz session.
      const start = await this.sessionStartService.startBlitzDuelSession(userId, {
        category_id: category_id ?? null,
        difficulty: difficulty ?? null,
        total_questions: 20,
      });
      challenger_session_id = start.session_id;

      duelPayload = {
        mode: 'blitz',
        quiz_id: null,
        category_id: category_id ?? null,
        difficulty: difficulty ?? null,
        challenger_user_id: userId,
        opponent_user_id: opponentUserId,
        challenger_session_id,
        status: 'pending',
        current_index: 1,
        challenger_points: 0,
        opponent_points: 0,
        summary_json: {},
      };
    }

    let duel = null;
    try {
      duel = await this.duelRepository.create(duelPayload);
    } catch (err) {
      if (duelMode === 'blitz' && err?.code === 'DB_SCHEMA_MISMATCH') {
        throw new AppError(
          'Blitz duels are not configured on the server. Apply `TriviaVerse/api/sql/duels.sql`.',
          501,
          'NOT_CONFIGURED'
        );
      }
      throw err;
    }
    if (!duel) throw new AppError('Failed to create duel', 500, 'DB_ERROR');

    return await this._decorateForUser(userId, duel, { quiz, users: null });
  }

  /**
   * Accept a pending duel challenge.
   * @param userId Opponent user id.
   * @param duelId Duel id.
   * @returns Decorated duel entry for the accepting user.
   */
  async acceptChallenge(userId: string, duelId: string) {
    const duel = await this.duelRepository.findById(asId(duelId));
    if (!duel) throw new AppError('Duel not found', 404, 'NOT_FOUND');
    if (duel.opponent_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (duel.status !== 'pending') throw new AppError('Duel is not pending', 409, 'CONFLICT');

    const duelMode = String(duel?.mode || 'custom')
      .trim()
      .toLowerCase();
    let quiz = null;

    let opponent_session_id = null;
    if (duelMode === 'custom') {
      quiz = await this.quizRepository.findById(duel.quiz_id);
      if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
      if (quiz.status !== 'published') {
        throw new AppError('Quiz must be published for duels', 400, 'INVALID_INPUT');
      }

      const start = await this.sessionStartService.startCustomQuizSession(userId, duel.quiz_id);
      opponent_session_id = start.session_id;
    } else if (duelMode === 'blitz') {
      // No need to create a second session; both players answer against the challenger's session snapshots.
      opponent_session_id = null;
    } else {
      throw new AppError('Invalid duel mode', 500, 'DB_ERROR');
    }

    const started_at = new Date(Date.now() + 3000).toISOString();
    const updated = await this.duelRepository.update(duel.id, {
      opponent_session_id,
      status: 'active',
      accepted_at: isoNow(),
      started_at,
      current_index: 1,
      question_started_at: null,
      challenger_points: duel.challenger_points ?? 0,
      opponent_points: duel.opponent_points ?? 0,
    });
    if (!updated) throw new AppError('Failed to accept duel', 500, 'DB_ERROR');

    return await this._decorateForUser(userId, updated, { quiz, users: null });
  }

  /**
   * Decline a pending duel challenge.
   * @param userId Opponent user id.
   * @param duelId Duel id.
   * @returns Decorated duel entry for the declining user.
   */
  async declineChallenge(userId: string, duelId: string) {
    const duel = await this.duelRepository.findById(asId(duelId));
    if (!duel) throw new AppError('Duel not found', 404, 'NOT_FOUND');
    if (duel.opponent_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (duel.status !== 'pending') throw new AppError('Duel is not pending', 409, 'CONFLICT');

    const updated = await this.duelRepository.update(duel.id, {
      status: 'declined',
      completed_at: isoNow(),
    });
    if (!updated) throw new AppError('Failed to decline duel', 500, 'DB_ERROR');
    return await this._decorateForUser(userId, updated, { quiz: null, users: null });
  }

  /**
   * Cancel a pending duel challenge.
   * @param userId Challenger user id.
   * @param duelId Duel id.
   * @returns Decorated duel entry for the cancelling user.
   */
  async cancelChallenge(userId: string, duelId: string) {
    const duel = await this.duelRepository.findById(asId(duelId));
    if (!duel) throw new AppError('Duel not found', 404, 'NOT_FOUND');
    if (duel.challenger_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (duel.status !== 'pending') throw new AppError('Duel is not pending', 409, 'CONFLICT');

    const updated = await this.duelRepository.update(duel.id, {
      status: 'canceled',
      completed_at: isoNow(),
    });
    if (!updated) throw new AppError('Failed to cancel duel', 500, 'DB_ERROR');
    return await this._decorateForUser(userId, updated, { quiz: null, users: null });
  }

  /**
   * List the current user's duels, decorating each with quiz/user details.
   * @param userId Current user id.
   * @param limit Max rows to return.
   * @returns Array of decorated duel entries.
   */
  async listMyDuels(userId: string, limit = 50) {
    const rows = await this.duelRepository.listByUserId(userId, limit);
    const resolvedRows = [];
    for (const d of rows) {
      // eslint-disable-next-line no-await-in-loop
      resolvedRows.push(await this._resolveIfReady(d));
    }

    const userIds = new Set();
    const quizIds = new Set();
    for (const d of resolvedRows) {
      if (d.challenger_user_id) userIds.add(d.challenger_user_id);
      if (d.opponent_user_id) userIds.add(d.opponent_user_id);
      if (d.quiz_id) quizIds.add(d.quiz_id);
    }

    const [users, quizzes] = await Promise.all([
      this.userRepository.findByIds(Array.from(userIds)),
      this.quizRepository.findByIds(Array.from(quizIds)),
    ]);
    const userMap = new Map<string, any>((users as any[]).map((u) => [u.id, u]));
    const quizMap = new Map<string, any>((quizzes as any[]).map((q) => [q.id, q]));

    return await Promise.all(
      resolvedRows.map((d) =>
        this._decorateForUser(userId, d, { quiz: quizMap.get(d.quiz_id) || null, users: userMap })
      )
    );
  }

  /**
   * Decorate a duel record with user/quiz display metadata and "my role" fields.
   * @param userId Current user id.
   * @param duel Raw duel row.
   * @param quiz Optional quiz row for custom duels.
   * @param users Optional map of user id -> user row.
   * @returns Decorated duel entry for the client.
   */
  async _decorateForUser(
    userId: string,
    duel: any,
    { quiz, users }: { quiz: any; users: Map<string, any> | null }
  ) {
    const challenger = users?.get ? users.get(duel.challenger_user_id) : null;
    const opponent = users?.get ? users.get(duel.opponent_user_id) : null;

    const meRole = duel.challenger_user_id === userId ? 'challenger' : 'opponent';
    const mySessionId =
      meRole === 'challenger' ? duel.challenger_session_id : duel.opponent_session_id;
    const otherSessionId =
      meRole === 'challenger' ? duel.opponent_session_id : duel.challenger_session_id;

    return {
      ...duel,
      me_role: meRole,
      my_session_id: mySessionId || null,
      opponent_session_id: otherSessionId || null,
      ms_until_start: msUntil(duel.started_at),
      quiz: quiz
        ? { id: quiz.id, title: quiz.title, visibility: quiz.visibility, status: quiz.status }
        : null,
      challenger_user: challenger
        ? { id: challenger.id, username: challenger.username, avatar_url: challenger.avatar_url }
        : null,
      opponent_user: opponent
        ? { id: opponent.id, username: opponent.username, avatar_url: opponent.avatar_url }
        : null,
    };
  }

  /**
   * Compute the current live state for a blitz duel question.
   * @param userId Current user id.
   * @param duelId Duel id.
   * @returns Live state payload (question, answers, timers, and claim info).
   */
  async getLiveState(userId: string, duelId: string) {
    const duel = await this.duelRepository.findById(asId(duelId));
    if (!duel) throw new AppError('Duel not found', 404, 'NOT_FOUND');
    if (duel.challenger_user_id !== userId && duel.opponent_user_id !== userId) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    if (duel.status !== 'active' && duel.status !== 'completed') {
      return {
        ...duel,
        ms_until_start: msUntil(duel.started_at),
        question: null,
      };
    }

    const now = Date.now();
    const startMs = duel.started_at ? new Date(duel.started_at).getTime() : NaN;
    const canStart = Number.isFinite(startMs) ? now >= startMs : true;

    const questions = await this.sessionQuestionRepository.listBySessionId(
      duel.challenger_session_id
    );
    const total = questions.length;
    const idx = Math.max(1, Math.min(total || 1, Number(duel.current_index) || 1));
    const current = questions[idx - 1] || null;

    let patched = duel;
    if (duel.status === 'active' && canStart && current && !duel.question_started_at) {
      const startIso = duel.started_at && Number.isFinite(startMs) ? duel.started_at : isoNow();
      patched =
        (await this.duelRepository.update(duel.id, { question_started_at: startIso })) || duel;
    }

    patched = await this._maybeAdvance(patched, questions);
    const fresh = (await this.duelRepository.findById(duel.id)) || patched;

    if (fresh.status === 'completed') {
      return { ...fresh, ms_until_start: msUntil(fresh.started_at), question: null };
    }

    if (!canStart || !current || !fresh.question_started_at) {
      return { ...fresh, ms_until_start: msUntil(fresh.started_at), question: null };
    }

    const opts = await this.sessionOptionRepository.listBySessionQuestionId(current.id);
    const claim = await this.duelClaimRepository.findByDuelAndQuestionIndex(fresh.id, idx);
    const answers = await this.duelAnswerRepository.listByDuelAndQuestionIndex(fresh.id, idx);
    const distinctUsers = new Set(answers.map((a) => a.user_id).filter(Boolean));
    const bothAnswered = distinctUsers.size >= 2;
    const canRevealCorrectOption = bothAnswered;
    const correctOpt = opts.find((o) => !!o.is_correct_snapshot) || null;

    const meRole = fresh.challenger_user_id === userId ? 'challenger' : 'opponent';

    return {
      ...fresh,
      ms_until_start: msUntil(fresh.started_at),
      me_role: meRole,
      question: {
        question_index: idx,
        total_questions: total,
        question_text: current.question_text_snapshot,
        time_limit_sec: current.time_limit_snapshot ?? 30,
        options: opts.map((o, i) => ({
          id: o.id,
          label: String.fromCharCode(65 + i),
          text: o.option_text_snapshot,
        })),
        correct_option_id: canRevealCorrectOption ? (correctOpt?.id ?? null) : null,
        started_at: fresh.question_started_at,
        claim,
        answers: answers.map((a) => ({
          user_id: a.user_id,
          session_option_id: a.session_option_id,
          is_correct: a.is_correct,
          answered_ms: a.answered_ms,
          created_at: a.created_at,
        })),
      },
    };
  }

  /**
   * Submit a live duel answer for the current question index.
   * @param userId Current user id.
   * @param duelId Duel id.
   * @param session_option_id Snapshot option id chosen by the user.
   * @returns Updated live state payload.
   */
  async submitLiveAnswer(
    userId: string,
    duelId: string,
    { session_option_id }: { session_option_id: string }
  ) {
    const duel = await this.duelRepository.findById(asId(duelId));
    if (!duel) throw new AppError('Duel not found', 404, 'NOT_FOUND');
    if (duel.status !== 'active') throw new AppError('Duel is not active', 409, 'CONFLICT');
    if (duel.challenger_user_id !== userId && duel.opponent_user_id !== userId) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const now = Date.now();
    const startMs = duel.started_at ? new Date(duel.started_at).getTime() : NaN;
    if (Number.isFinite(startMs) && now < startMs) {
      throw new AppError('Duel has not started yet', 409, 'NOT_STARTED');
    }

    const questions = await this.sessionQuestionRepository.listBySessionId(
      duel.challenger_session_id
    );
    if (questions.length === 0) throw new AppError('No questions', 404, 'NOT_FOUND');
    const idx = Math.max(1, Math.min(questions.length, Number(duel.current_index) || 1));
    const current = questions[idx - 1];

    let questionStartedAt = duel.question_started_at;
    if (!questionStartedAt) {
      const patched = await this.duelRepository.update(duel.id, { question_started_at: isoNow() });
      questionStartedAt = patched?.question_started_at || isoNow();
    }

    const qStart = new Date(questionStartedAt).getTime();
    const answered_ms = Math.max(0, Number.isFinite(qStart) ? now - qStart : 0);

    const optionId = asId(session_option_id);
    if (!optionId) throw new AppError('Invalid session_option_id', 400, 'INVALID_INPUT');

    const opts = await this.sessionOptionRepository.listBySessionQuestionId(current.id);
    const chosen = opts.find((o) => String(o.id) === String(optionId));
    if (!chosen) throw new AppError('Invalid session_option_id', 400, 'INVALID_INPUT');

    const is_correct = !!chosen.is_correct_snapshot;
    await this.duelAnswerRepository.create({
      duel_id: duel.id,
      user_id: userId,
      question_index: idx,
      session_option_id: optionId,
      is_correct,
      answered_ms,
    });

    if (is_correct) {
      try {
        await this.duelClaimRepository.create({
          duel_id: duel.id,
          question_index: idx,
          winner_user_id: userId,
          answered_ms,
        });

        const challengerPoints = Number(duel.challenger_points) || 0;
        const opponentPoints = Number(duel.opponent_points) || 0;
        const patch =
          userId === duel.challenger_user_id
            ? { challenger_points: challengerPoints + 1 }
            : { opponent_points: opponentPoints + 1 };
        await this.duelRepository.update(duel.id, patch);
      } catch (err) {
        if (err?.code !== 'CONFLICT') throw err;
      }
    }

    return await this.getLiveState(userId, duel.id);
  }

  /**
   * Advance to the next question or complete the duel when both answered or time expired.
   * @param duel Duel row.
   * @param questions Snapshot session questions for the duel.
   * @returns Updated duel row (or original).
   */
  async _maybeAdvance(duel: any, questions: any[]) {
    if (!duel || duel.status !== 'active') return duel;
    if (!Array.isArray(questions) || questions.length === 0) return duel;

    const total = questions.length;
    const idx = Math.max(1, Math.min(total, Number(duel.current_index) || 1));
    const current = questions[idx - 1];
    if (!current) return duel;
    if (!duel.question_started_at) return duel;

    const timeLimitMs = Math.max(0, (Number(current.time_limit_snapshot) || 30) * 1000);
    const startedMs = new Date(duel.question_started_at).getTime();
    const elapsed = Date.now() - startedMs;
    const timedOut =
      Number.isFinite(elapsed) && Number.isFinite(startedMs) && elapsed >= timeLimitMs;

    const claim = await this.duelClaimRepository.findByDuelAndQuestionIndex(duel.id, idx);
    const answers = await this.duelAnswerRepository.listByDuelAndQuestionIndex(duel.id, idx);
    const distinctUsers = new Set(answers.map((a) => a.user_id).filter(Boolean));
    const bothAnswered = distinctUsers.size >= 2;

    if (!bothAnswered && !timedOut) return duel;

    if (idx >= total) {
      const allAnswers = await this.duelAnswerRepository.listByDuelId(duel.id, 1000);
      const totalMsByUser = new Map();
      for (const a of allAnswers) {
        const prev = totalMsByUser.get(a.user_id) || 0;
        totalMsByUser.set(a.user_id, prev + Math.max(0, Number(a.answered_ms) || 0));
      }

      const cp = Number(duel.challenger_points) || 0;
      const op = Number(duel.opponent_points) || 0;
      let winner = null;
      if (cp > op) winner = duel.challenger_user_id;
      else if (op > cp) winner = duel.opponent_user_id;
      else {
        const cMs = totalMsByUser.get(duel.challenger_user_id) ?? 0;
        const oMs = totalMsByUser.get(duel.opponent_user_id) ?? 0;
        if (cMs < oMs) winner = duel.challenger_user_id;
        else if (oMs < cMs) winner = duel.opponent_user_id;
        else winner = null;
      }

      return (
        (await this.duelRepository.update(duel.id, {
          status: 'completed',
          winner_user_id: winner,
          completed_at: isoNow(),
        })) || duel
      );
    }

    return (
      (await this.duelRepository.update(duel.id, {
        current_index: idx + 1,
        question_started_at: isoNow(),
      })) || duel
    );
  }

  /**
   * Compute performance summary for a session used in async custom duels.
   * @param sessionId Game session id.
   * @returns Summary including correct count and total time.
   */
  async _computePerformance(sessionId: string) {
    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
      questions.map((q) => q.id)
    );
    const ansBySqId = new Map<string, any>((answers as any[]).map((a) => [a.session_question_id, a]));

    let correct = 0;
    let totalTime = 0;
    for (const q of questions) {
      const a = ansBySqId.get(q.id);
      if (a?.is_correct) correct += 1;
      const answeredSec = safeNum(a?.answered_in_sec, NaN);
      if (Number.isFinite(answeredSec)) totalTime += Math.max(0, answeredSec);
      else totalTime += Math.max(0, safeNum(q?.time_limit_snapshot, 30));
    }

    return {
      correct_count: correct,
      total_time_sec: totalTime,
      total_questions: questions.length,
    };
  }

  /**
   * Resolve a duel that has both sessions completed (custom duels).
   * @param duel Duel row.
   * @returns Updated duel row when resolved; otherwise the original row.
   */
  async _resolveIfReady(duel: any) {
    if (!duel) return duel;
    if (duel.status !== 'active') return duel;
    // Live duels are resolved via duel_answers/duel_claims, not by session completion.
    if (duel.started_at) return duel;
    if (!duel.challenger_session_id || !duel.opponent_session_id) return duel;

    const [a, b] = await Promise.all([
      this.gameSessionRepository.findById(duel.challenger_session_id),
      this.gameSessionRepository.findById(duel.opponent_session_id),
    ]);
    if (!a || !b) return duel;
    if (a.status !== 'completed' || b.status !== 'completed') return duel;

    const [challengerPerf, opponentPerf] = await Promise.all([
      this._computePerformance(duel.challenger_session_id),
      this._computePerformance(duel.opponent_session_id),
    ]);

    const result = computeWinner({ challenger: challengerPerf, opponent: opponentPerf });
    const winner_user_id =
      result === 'challenger'
        ? duel.challenger_user_id
        : result === 'opponent'
          ? duel.opponent_user_id
          : null;

    const updated = await this.duelRepository.update(duel.id, {
      status: 'completed',
      winner_user_id,
      completed_at: isoNow(),
      summary_json: {
        challenger: challengerPerf,
        opponent: opponentPerf,
        winner: result,
      },
    });

    return updated || duel;
  }
}

