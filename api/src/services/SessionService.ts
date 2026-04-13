/**
 * Shared session gameplay service.
 */
import AppError from '../utils/AppError.js';
import { sessionCache } from '../utils/sessionCache.js';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MILLIONAIRE_PRIZES = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000,
];
const BLITZ_TIME_LIMIT_SEC = 15;
const BLITZ_MAX_STRIKES = 1;
const PHONE_LIFELINE_API = 'phone';
const PHONE_LIFELINE_DB = 'phone_a_friend';

function normalizeLifelineType(lifelineType: string | null | undefined) {
  const value = String(lifelineType || '')
    .trim()
    .toLowerCase();
  if (value === PHONE_LIFELINE_API || value === PHONE_LIFELINE_DB) {
    return PHONE_LIFELINE_DB;
  }
  return value;
}

function presentLifelineType(lifelineType: string | null | undefined) {
  const value = normalizeLifelineType(lifelineType);
  return value === PHONE_LIFELINE_DB ? PHONE_LIFELINE_API : value;
}

function isPhoneLifeline(lifelineType: string | null | undefined) {
  return normalizeLifelineType(lifelineType) === PHONE_LIFELINE_DB;
}

function blitzDifficultyToLeaderboardMode(difficulty: string | null | undefined) {
  const d = String(difficulty || '')
    .trim()
    .toLowerCase();
  if (d === 'easy') return 'blitz_easy';
  if (d === 'medium') return 'blitz_medium';
  if (d === 'hard') return 'blitz_hard';
  return 'blitz';
}

function computeStars({
  scoreTotal = 0,
  maxScore = 0,
  passScoreMin = null,
}: {
  scoreTotal?: number | null;
  maxScore?: number | null;
  passScoreMin?: number | null;
}) {
  const score = Math.max(0, Number(scoreTotal) || 0);
  const max = Math.max(0, Number(maxScore) || 0);
  const pass = passScoreMin == null ? null : Math.max(0, Number(passScoreMin) || 0);

  const passed = pass != null ? score >= pass : max > 0 ? score / max >= 0.5 : score > 0;
  if (!passed) return { passed: false, stars: 0 };

  const ratio = max > 0 ? score / max : 1;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.75 ? 2 : 1;
  return { passed: true, stars };
}

function computeStoryOutcome({
  correctCount = 0,
  totalCount = 0,
}: {
  correctCount?: number | null;
  totalCount?: number | null;
} = {}) {
  const total = Math.max(0, Number(totalCount) || 0);
  const correct = Math.max(0, Number(correctCount) || 0);
  const ratio = total > 0 ? correct / total : 0;

  const passed = ratio >= 0.7;
  const stars = ratio >= 1 ? 3 : ratio >= 0.9 ? 2 : ratio >= 0.8 ? 1 : 0;
  return {
    passed,
    stars,
    accuracy_pct: Math.round(ratio * 100),
    correct_count: correct,
    total_count: total,
  };
}

function computeTimeRemainingSec(session: any) {
  if (!session?.started_at) return null;
  const started = new Date(session.started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, 60 - elapsed);
}

function computeTimeRemainingFromStartedAt(started_at: any) {
  if (!started_at) return null;
  const started = new Date(started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, 60 - elapsed);
}

function computePerQuestionRemainingFromStartedAt(started_at: any, limitSec: any) {
  if (!started_at) return null;
  const started = new Date(started_at).getTime();
  const elapsed = Math.floor((Date.now() - started) / 1000);
  return Math.max(0, Math.max(0, Number(limitSec) || 0) - elapsed);
}

function buildAudiencePoll(options: any[]) {
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

function pickPhoneSuggestion(options: any[]) {
  const correct = options.find((o) => !!o.is_correct_snapshot);
  const incorrect = options.filter((o) => !o.is_correct_snapshot);
  if (!correct) return null;

  const roll = Math.random();
  if (roll < 0.75) return correct.id; // mostly correct
  if (incorrect.length === 0) return correct.id;
  return incorrect[Math.floor(Math.random() * incorrect.length)].id;
}

// Core gameplay service for all modes (custom/story/classic/blitz/millionaire).
export class SessionService {
  private gameSessionRepository: any;
  private sessionQuestionRepository: any;
  private sessionOptionRepository: any;
  private sessionAnswerRepository: any;
  private sessionLifelineRepository: any;
  private leaderboardRepository: any;
  private userStatsRepository: any;
  private quizQuestionRepository: any;
  private quizScoreRepository: any;
  private quizRatingRepository: any;
  private storyLevelRepository: any;
  private userStoryProgressRepository: any;
  private storySessionRepository: any;
  private classicCategoryLevelRepository: any;
  private userClassicProgressRepository: any;
  private classicSessionRepository: any;
  private sessionStartService: any;

  /**
   * Construct the gameplay service with all required repositories/services.
   * @param gameSessionRepository Session persistence and score/status updates.
   * @param sessionQuestionRepository Session question snapshots.
   * @param sessionOptionRepository Session option snapshots.
   * @param sessionAnswerRepository Answer persistence.
   * @param sessionLifelineRepository Lifeline persistence.
   * @param leaderboardRepository Leaderboard writes.
   * @param userStatsRepository XP updates.
   * @param quizQuestionRepository Source question lookup (explanations).
   * @param quizScoreRepository Per-quiz best score tracking.
   * @param quizRatingRepository Quiz rating lookup for XP eligibility.
   * @param storyLevelRepository Story-level metadata.
   * @param userStoryProgressRepository Story progress persistence.
   * @param storySessionRepository Story session metadata for a game session.
   * @param classicCategoryLevelRepository Classic level metadata.
   * @param userClassicProgressRepository Classic progress persistence.
   * @param classicSessionRepository Classic session metadata for a game session.
   * @param sessionStartService Session creation/append helpers.
   * @returns A `SessionService` instance.
   */
  constructor({
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    sessionAnswerRepository,
    sessionLifelineRepository,
    leaderboardRepository,
    userStatsRepository,
    quizQuestionRepository,
    quizScoreRepository,
    quizRatingRepository,
    storyLevelRepository,
    userStoryProgressRepository,
    storySessionRepository,
    classicCategoryLevelRepository = null,
    userClassicProgressRepository = null,
    classicSessionRepository = null,
    sessionStartService,
  }) {
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.sessionAnswerRepository = sessionAnswerRepository;
    this.sessionLifelineRepository = sessionLifelineRepository;
    this.leaderboardRepository = leaderboardRepository;
    this.userStatsRepository = userStatsRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.storyLevelRepository = storyLevelRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
    this.storySessionRepository = storySessionRepository;
    this.classicCategoryLevelRepository = classicCategoryLevelRepository;
    this.userClassicProgressRepository = userClassicProgressRepository;
    this.classicSessionRepository = classicSessionRepository;
    this.sessionStartService = sessionStartService;
  }

  /**
   * Ensure the caller is the owner of the session (for non-guest sessions).
   * @param sessionId Session id.
   * @param userId Authenticated user id.
   * @returns The session record if accessible.
   */
  async assertSessionOwner(sessionId: string, userId: string | null | undefined) {
    if (!userId) throw new AppError('Missing Bearer token', 401, 'UNAUTHORIZED');
    const session = await this.gameSessionRepository.findById(sessionId);
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return session;
  }

  /**
   * Get the current question payload for a session.
   * @param sessionId Session id.
   * @param userId Authenticated user id (or null for guests).
   * @returns The current question state (includes mode-specific fields like lifelines/timers).
   */
  async getCurrent(sessionId: string, userId: string | null | undefined) {
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

      const payload: any = {
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
      }

      if (cached.mode === 'millionaire') {
        const lifelines = isGuest
          ? Array.isArray(cached.lifelines)
            ? cached.lifelines
            : []
          : await this.sessionLifelineRepository.listBySessionId(sessionId);
        payload.lifelines_used = lifelines.map((l) => presentLifelineType(l.lifeline_type));

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
            isPhoneLifeline(l.lifeline_type) &&
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
          Number(payload.total_questions) ||
            (Array.isArray(cached.questions) ? cached.questions.length : 15)
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

    const options = await this.sessionOptionRepository.listBySessionQuestionId(current.id);
    const payload: any = {
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
    } else {
      payload.time_limit_sec = current.time_limit_snapshot;
    }

    if (session.mode === 'millionaire') {
      const lifelines = await this.sessionLifelineRepository.listBySessionId(sessionId);
      payload.lifelines_used = lifelines.map((l) => presentLifelineType(l.lifeline_type));

      const fifty = lifelines.find(
        (l) =>
          l.lifeline_type === 'fifty_fifty' && l.payload_json?.session_question_id === current.id
      );
      if (fifty?.payload_json?.disabled_option_ids) {
        payload.disabled_option_ids = fifty.payload_json.disabled_option_ids;
      }

      const audience = lifelines.find(
        (l) => l.lifeline_type === 'audience' && l.payload_json?.session_question_id === current.id
      );
      if (audience?.payload_json?.audience_poll) {
        payload.audience_poll = audience.payload_json.audience_poll;
      }

      const phone = lifelines.find(
        (l) => isPhoneLifeline(l.lifeline_type) && l.payload_json?.session_question_id === current.id
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

  /**
   * Build a review view of a session (answers + correct options + explanations when missed).
   * @param sessionId Session id.
   * @param userId Authenticated user id (or null for guests).
   * @returns Review payload for the client.
   */
  async getReview(sessionId: string, userId: string | null | undefined) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode && cached.is_guest) {
      const questions = Array.isArray(cached.questions) ? cached.questions : [];
      const ans = cached.answers_by_session_question_id || {};

      const items = questions.map((q) => {
        const sessionQuestionId = String(q?.session_question_id || '');
        const record = sessionQuestionId ? ans[sessionQuestionId] : null;
        const chosenOptionId = record?.chosen_option_id ?? null;
        const correctOptionId = record?.correct_option_id ?? null;

        const opts = Array.isArray(q?.options) ? q.options : [];
        const chosen = chosenOptionId
          ? opts.find((o) => String(o.id) === String(chosenOptionId)) || null
          : null;
        const correct = correctOptionId
          ? opts.find((o) => String(o.id) === String(correctOptionId)) || null
          : null;

        const isCorrect = record?.is_correct ?? null;

        return {
          session_question_id: sessionQuestionId || null,
          question_number: q?.question_number ?? null,
          question_text: q?.question_text ?? null,
          is_correct: isCorrect,
          chosen_option_id: chosenOptionId,
          chosen_label: chosen?.label ?? null,
          chosen_text: chosen?.text ?? null,
          correct_option_id: correctOptionId,
          correct_label: correct?.label ?? null,
          correct_text: correct?.text ?? null,
          explanation:
            isCorrect === false ? (q?.explanation != null ? String(q.explanation) : null) : null,
        };
      });

      return {
        session_id: sessionId,
        mode: cached.mode,
        quiz_id: null,
        questions: items,
      };
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
    const sqIds = questions.map((q) => q.id).filter(Boolean);

    const [options, answers, sourceRows] = await Promise.all([
      this.sessionOptionRepository.listBySessionQuestionIds(sqIds),
      this.sessionAnswerRepository.listBySessionQuestionIds(sqIds),
      this.quizQuestionRepository?.listByIds
        ? this.quizQuestionRepository.listByIds(
            questions.map((q) => q.source_question_id).filter(Boolean)
          )
        : Promise.resolve([]),
    ]);

    const optionsBySqId = new Map();
    for (const o of options || []) {
      const sid = o.session_question_id;
      if (!sid) continue;
      if (!optionsBySqId.has(sid)) optionsBySqId.set(sid, []);
      optionsBySqId.get(sid).push(o);
    }

    const answerBySqId = new Map<string, any>(((answers || []) as any[]).map((a) => [a.session_question_id, a]));
    const sourceById = new Map<string, any>(((sourceRows || []) as any[]).map((r) => [r.id, r]));

    const labelFor = (o) => {
      const idx = Math.max(1, Number(o?.order_index) || 1) - 1;
      return LABELS[idx] || String(o?.order_index ?? '');
    };

    const items = questions.map((sq) => {
      const opts = (optionsBySqId.get(sq.id) || []).slice().sort((a, b) => {
        const x = Number(a.order_index) || 0;
        const y = Number(b.order_index) || 0;
        return x - y;
      });
      const correct = opts.find((o) => !!o.is_correct_snapshot) || null;
      const answer = answerBySqId.get(sq.id) || null;
      const chosen = answer?.chosen_option_id
        ? opts.find((o) => String(o.id) === String(answer.chosen_option_id)) || null
        : null;

      const isCorrect = answer?.is_correct ?? null;
      const explanation =
        isCorrect === false ? (sourceById.get(sq.source_question_id)?.explanation ?? null) : null;

      return {
        session_question_id: sq.id,
        question_number: sq.order_index,
        question_text: sq.question_text_snapshot,
        is_correct: isCorrect,
        chosen_option_id: chosen?.id ?? answer?.chosen_option_id ?? null,
        chosen_label: chosen ? labelFor(chosen) : null,
        chosen_text: chosen?.option_text_snapshot ?? null,
        correct_option_id: correct?.id ?? null,
        correct_label: correct ? labelFor(correct) : null,
        correct_text: correct?.option_text_snapshot ?? null,
        explanation: explanation != null ? String(explanation) : null,
      };
    });

    return {
      session_id: sessionId,
      mode: session.mode,
      quiz_id: session.quiz_id ?? null,
      questions: items,
    };
  }

  /**
   * Record an answer for the current question and advance the session (mode-specific rules apply).
   * @param sessionId Session id.
   * @param userId Authenticated user id (or null for guests).
   * @param body Answer payload containing the session question id and chosen option id.
   * @returns Answer outcome (correctness, score updates, and optionally the next question).
   */
  async submitAnswer(
    sessionId: string,
    userId: string | null | undefined,
    body: { session_question_id: string; chosen_option_id: string; answered_in_sec?: number }
  ) {
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

      if (String(body.session_question_id) !== String(current.session_question_id)) {
        throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');
      }

      const chosen = (current.options || []).find((o) => o.id === body.chosen_option_id);
      if (!chosen) throw new AppError('Invalid chosen_option_id', 400, 'INVALID_INPUT');

      const correctId =
        cached.correct_option_id_by_session_question_id?.[current.session_question_id] || null;
      const computedCorrect = correctId
        ? String(correctId) === String(body.chosen_option_id)
        : false;

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

      if (isGuest) {
        if (!cached.answered_session_question_id_set) {
          cached.answered_session_question_id_set = new Set<string>();
        }
        if (
          (cached.answered_session_question_id_set as Set<string>).has(
            String(current.session_question_id)
          )
        ) {
          throw new AppError('Already answered', 409, 'CONFLICT');
        }
        (cached.answered_session_question_id_set as Set<string>).add(
          String(current.session_question_id)
        );

        if (!cached.answers_by_session_question_id) cached.answers_by_session_question_id = {};
        (cached.answers_by_session_question_id as Record<string, any>)[
          String(current.session_question_id)
        ] = {
          chosen_option_id: body.chosen_option_id,
          correct_option_id: correctId,
          is_correct,
          answered_in_sec: body.answered_in_sec ?? null,
        };
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
          if (isGuest) sessionCache.set(sessionId, cached);
          else sessionCache.del(sessionId);
          if (!isGuest) {
            try {
              await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
            } catch {
              // ignore
            }

            // Record blitz score even when the session ends due to strikes.
            try {
              const fresh = await this.gameSessionRepository.findById(sessionId);
              const modeForLeaderboard =
                fresh?.mode === 'blitz'
                  ? blitzDifficultyToLeaderboardMode(fresh?.difficulty)
                  : fresh?.mode;
              if (fresh?.user_id && modeForLeaderboard) {
                await this.leaderboardRepository.insertFromSession({
                  user_id: fresh.user_id,
                  mode: modeForLeaderboard,
                  score_value: fresh.score_total ?? cached.score_total ?? 0,
                });
                await this.leaderboardRepository.insertFromSession({
                  user_id: fresh.user_id,
                  mode: 'global',
                  score_value: fresh.score_total ?? cached.score_total ?? 0,
                });
              }
            } catch (err) {
              if (err?.code !== 'NOT_CONFIGURED' && err?.code !== 'DB_SCHEMA_MISMATCH') throw err;
            }
          }
          return {
            is_correct: false,
            chosen_option_id: body.chosen_option_id,
            correct_option_id: correctId,
            ...(current?.explanation != null ? { explanation: String(current.explanation) } : {}),
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

      if (cached.mode === 'millionaire') {
        if (!is_correct) {
          cached.status = 'completed';
          sessionCache.set(sessionId, cached);
          return {
            is_correct: false,
            chosen_option_id: body.chosen_option_id,
            correct_option_id: correctId,
            ...(current?.explanation != null ? { explanation: String(current.explanation) } : {}),
            current_prize: cached.score_total ?? 0,
            next_question_available: false,
            finished: true,
          };
        }

        const qIdx = Math.max(1, Number(current.question_number) || 1);
        const prize = MILLIONAIRE_PRIZES[qIdx - 1] ?? cached.score_total ?? 0;
        if (!isGuest) {
          const updatedSession = await this.gameSessionRepository.setScore(sessionId, prize);
          cached.score_total = updatedSession?.score_total ?? prize;
        } else {
          cached.score_total = prize;
        }
        cached.current_index = idx + 1;

        const next = Array.isArray(cached.questions)
          ? (cached.questions as any[])[Number(cached.current_index) || 0]
          : null;
        const next_question_available = !!next;

        let next_question: any = null;
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
          const timeLimit = Number((current as any).time_limit_sec ?? 30);
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

        let next = Array.isArray(cached.questions)
          ? (cached.questions as any[])[Number(cached.current_index) || 0]
          : null;

      // Blitz should primarily end by strikes. If we ran out of pre-snapshotted questions,
      // refill the session (logged-in) or wrap around (guest) so gameplay can continue.
      if (cached.mode === 'blitz' && !next) {
        const strikes = Math.max(0, Number(cached.strike_count) || 0);
        if (strikes < BLITZ_MAX_STRIKES) {
          if (isGuest) {
            cached.current_index = 0;
            cached.question_started_at = new Date().toISOString();
              cached.answered_session_question_id_set = new Set<string>();
            cached.answers_by_session_question_id = {};

            try {
              const arr = Array.isArray(cached.questions) ? cached.questions.slice() : [];
              for (let i = arr.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
              }
              for (let i = 0; i < arr.length; i += 1) {
                arr[i] = { ...arr[i], question_number: i + 1, total_questions: arr.length };
              }
              cached.questions = arr;
            } catch {
              // ignore
            }

            next = Array.isArray(cached.questions)
              ? (cached.questions as any[])[Number(cached.current_index) || 0]
              : null;
          } else if (this.sessionStartService?.appendBlitzQuestionsToSession) {
            try {
              const session = await this.gameSessionRepository.findById(sessionId);
              const appended = await this.sessionStartService.appendBlitzQuestionsToSession(
                sessionId,
                {
                  difficulty: session?.difficulty ?? null,
                  count: 50,
                }
              );
              const extra = Array.isArray(appended?.appended) ? appended.appended : [];
              const totalQuestions = Number(appended?.total_questions) || undefined;
              const correct = appended?.correctBySqId || {};

              if (!Array.isArray(cached.questions)) cached.questions = [];
              cached.questions = [...(cached.questions as any[]), ...extra];
              cached.correct_option_id_by_session_question_id = {
                ...((cached.correct_option_id_by_session_question_id || {}) as Record<string, any>),
                ...(correct as Record<string, any>),
              };

              if (totalQuestions && Array.isArray(cached.questions)) {
                cached.questions = (cached.questions as any[]).map((q) => ({
                  ...(q as any),
                  total_questions: totalQuestions,
                }));
              }

              next = Array.isArray(cached.questions)
                ? (cached.questions as any[])[Number(cached.current_index) || 0]
                : null;
            } catch (err) {
              // If refill fails, fall through and report "no next question".
              if (err?.code === 'NO_POOL' || err?.code === 'NOT_ENOUGH_QUESTIONS') {
                // ignore
              } else {
                // ignore other refill errors to avoid breaking answer submission
              }
            }
          }
        }
      }

      const next_question_available = !!next;

      sessionCache.set(sessionId, cached);

      const explanation =
        !is_correct && current?.explanation != null ? String(current.explanation) : null;
      const base: any = {
        is_correct,
        chosen_option_id: body.chosen_option_id,
        correct_option_id: correctId,
        ...(explanation ? { explanation } : {}),
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
      }

      return base;
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    if (session.status && session.status !== 'in_progress') {
      throw new AppError('Session is not active', 409, 'NOT_ACTIVE');
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

    let explanation = null;
    if (!is_correct && this.quizQuestionRepository?.findById) {
      try {
        const src = await this.quizQuestionRepository.findById(sessionQuestion.source_question_id);
        explanation = src?.explanation ?? null;
      } catch {
        // ignore
      }
    }

    if (session.mode === 'blitz') {
      const strikesBefore = (answersBefore || []).filter((a) => a && a.is_correct === false).length;
      const strikes = strikesBefore + (is_correct ? 0 : 1);

      if (strikes >= BLITZ_MAX_STRIKES) {
        await this.gameSessionRepository.updateStatus(sessionId, 'abandoned');
        sessionCache.del(sessionId);

        // Record blitz score even when the session ends due to strikes.
        try {
          const modeForLeaderboard = blitzDifficultyToLeaderboardMode(session?.difficulty);
          await this.leaderboardRepository.insertFromSession({
            user_id: session.user_id,
            mode: modeForLeaderboard,
            score_value: session.score_total ?? 0,
          });
          await this.leaderboardRepository.insertFromSession({
            user_id: session.user_id,
            mode: 'global',
            score_value: session.score_total ?? 0,
          });
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED' && err?.code !== 'DB_SCHEMA_MISMATCH') throw err;
        }

        return {
          is_correct: false,
          chosen_option_id: chosen.id,
          correct_option_id: correctOptionId,
          ...(explanation != null ? { explanation: String(explanation) } : {}),
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
      let next = questions.find((q) => !answeredSet.has(q.id)) || null;

      // If we ran out of pre-snapshotted questions, append more so blitz ends by strikes.
      if (!next && this.sessionStartService?.appendBlitzQuestionsToSession) {
        try {
          await this.sessionStartService.appendBlitzQuestionsToSession(sessionId, {
            difficulty: session?.difficulty ?? null,
            count: 50,
          });
          const updatedQuestions = await this.sessionQuestionRepository.listBySessionId(sessionId);
          next = updatedQuestions.find((q) => !answeredSet.has(q.id)) || null;
        } catch {
          // ignore
        }
      }

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
          ...(explanation != null ? { explanation: String(explanation) } : {}),
          current_prize: session.score_total ?? 0,
          next_question_available: false,
          finished: true,
        };
      }

      const qIdx = Math.max(1, Number(sessionQuestion.order_index) || 1);
      const prize = MILLIONAIRE_PRIZES[qIdx - 1] ?? session.score_total ?? 0;
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
            (l) =>
              l.lifeline_type === 'fifty_fifty' && l.payload_json?.session_question_id === next.id
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
      }
    }

    return {
      is_correct,
      chosen_option_id: chosen.id,
      correct_option_id: correctOptionId,
      ...(!is_correct && explanation != null ? { explanation: String(explanation) } : {}),
      score_total: updatedSession?.score_total ?? session.score_total,
      next_question_available,
      ...(next_question ? { next_question } : {}),
      ...(session.mode === 'custom' ? { speed_bonus } : {}),
    };
  }

  /**
   * Use a lifeline (millionaire-only) and persist its payload.
   * @param sessionId Session id.
   * @param userId Authenticated user id (or null for guests).
   * @param body Lifeline payload containing type and session question id.
   * @returns Lifeline result payload (disabled options, poll, phone hint, etc.).
   */
  async useLifeline(
    sessionId: string,
    userId: string | null | undefined,
    body: { lifeline_type: string; session_question_id: string }
  ) {
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
      if (options.length === 0)
        throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

      const correctId =
        cached.correct_option_id_by_session_question_id?.[current.session_question_id] || null;

      let payload: any = {};
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
        if (!cached.answered_session_question_id_set)
          cached.answered_session_question_id_set = new Set<string>();
        (cached.answered_session_question_id_set as Set<string>).add(
          String(current.session_question_id)
        );
        cached.current_index = idx + 1;
        sessionCache.set(sessionId, cached);
        const next = Array.isArray(cached.questions)
          ? (cached.questions as any[])[Number(cached.current_index) || 0]
          : null;
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
    if (options.length === 0)
      throw new AppError('Invalid session_question_id', 400, 'INVALID_INPUT');

      let payload: any = {};
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
        message: suggested
          ? `I think it's option ${LABELS[suggested.order_index - 1] || ''}.`
          : `I'm not sure...`,
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
      if (
        c?.mode === 'millionaire' &&
        c.user_id === userId &&
        Number.isFinite(Number(c.current_index))
      ) {
        c.current_index = Math.max(0, Number(c.current_index) || 0) + 1;
        sessionCache.set(sessionId, c);
      }

      return { lifeline_type: 'skip', skipped: true, next_question_available };
    }

    return { lifeline_type: body.lifeline_type, ...payload };
  }

  /**
   * Mark a session as finished and perform post-processing (leaderboards, XP, progress unlocks).
   * @param sessionId Session id.
   * @param userId Authenticated user id (or null for guests).
   * @param status Final session status (e.g. `completed`, `abandoned`).
   * @returns Summary payload including warnings and mode-specific completion details.
   */
  async finish(sessionId: string, userId: string | null | undefined, status: string) {
    const cached = sessionCache.get(sessionId);
    if (cached?.mode && cached.is_guest) {
      cached.status = status;
      sessionCache.set(sessionId, cached);
      return { status };
    }

    const session = await this.assertSessionOwner(sessionId, userId);
    const updated = await this.gameSessionRepository.updateStatus(sessionId, status);
    if (!updated) throw new AppError('Session not found', 404, 'NOT_FOUND');

    const warnings = [];

    let storyXpEligible = false;
    let storyXpValue = 0;
    let storySummary = null;

    let classicXpEligible = false;
    let classicXpValue = 0;
    let classicSummary = null;

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
              const totalQuestions = questions.length;
              const scoreTotal = Number(updated.score_total) || 0;
              const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
                questions.map((q) => q.id)
              );
              const correctCount = (answers || []).filter((a) => a && a.is_correct === true).length;
              const outcome = computeStoryOutcome({ correctCount, totalCount: totalQuestions });

              const passed = outcome.passed;
              const stars = outcome.stars;

              // Award XP for every passed story level.
              // Use `story_levels.xp_reward` when available; otherwise fall back to the session score.
              const xpReward = Number(level?.xp_reward);
              storyXpEligible = Boolean(passed);
              storyXpValue = Number.isFinite(xpReward) ? xpReward : scoreTotal;

              await this.userStoryProgressRepository.upsertResult(session.user_id, level.id, {
                score_total: scoreTotal,
                stars_earned: stars,
                is_completed: passed,
              });

              let hasNextLevel = false;
              let nextLevelNumber = null;
              if (meta.level_number) {
                const next = await this.storyLevelRepository.findByLevelNumber(
                  Number(meta.level_number) + 1
                );
                if (next?.id) {
                  hasNextLevel = true;
                  nextLevelNumber = Number(meta.level_number) + 1;
                  if (passed) {
                    await this.userStoryProgressRepository.ensureUnlocked(session.user_id, next.id);
                  }
                }
              }

              storySummary = {
                level_number: meta.level_number ?? null,
                ...outcome,
                score_total: scoreTotal,
                passed,
                has_next_level: hasNextLevel,
                next_level_number: nextLevelNumber,
              };
            }
          }
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED') throw err;
          // If story_sessions isn't configured, gameplay still works but progress unlock won't persist.
        }
      }
    }

    if (session.mode === 'classic' && status === 'completed') {
      if (
        this.classicSessionRepository &&
        this.classicCategoryLevelRepository &&
        this.userClassicProgressRepository
      ) {
        try {
          const meta = await this.classicSessionRepository.findBySessionId(sessionId);
          if (meta?.level_id) {
            const level = await this.classicCategoryLevelRepository.findById(meta.level_id);
            if (level?.id) {
              const questions = await this.sessionQuestionRepository.listBySessionId(sessionId);
              const totalQuestions = questions.length;
              const scoreTotal = Number(updated.score_total) || 0;
              const answers = await this.sessionAnswerRepository.listBySessionQuestionIds(
                questions.map((q) => q.id)
              );
              const correctCount = (answers || []).filter((a) => a && a.is_correct === true).length;
              const outcome = computeStoryOutcome({ correctCount, totalCount: totalQuestions });

              const passed = outcome.passed;
              const stars = outcome.stars;

              const xpReward = Number(level?.xp_reward);
              classicXpEligible = Boolean(passed);
              classicXpValue = Number.isFinite(xpReward) ? xpReward : scoreTotal;

              await this.userClassicProgressRepository.upsertResult(session.user_id, level.id, {
                score_total: scoreTotal,
                stars_earned: stars,
                is_completed: passed,
              });

              let hasNextLevel = false;
              let nextLevelNumber = null;
              if (meta.level_number && meta.category_id) {
                const next = await this.classicCategoryLevelRepository.findByCategoryAndLevelNumber(
                  meta.category_id,
                  Number(meta.level_number) + 1
                );
                if (next?.id) {
                  hasNextLevel = true;
                  nextLevelNumber = Number(meta.level_number) + 1;
                  if (passed) {
                    await this.userClassicProgressRepository.ensureUnlocked(
                      session.user_id,
                      next.id
                    );
                  }
                }
              }

              classicSummary = {
                category_id: meta.category_id ?? null,
                level_number: meta.level_number ?? null,
                ...outcome,
                score_total: scoreTotal,
                passed,
                has_next_level: hasNextLevel,
                next_level_number: nextLevelNumber,
              };
            }
          }
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED') throw err;
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
        modeForLeaderboard = blitzDifficultyToLeaderboardMode(session.difficulty);
      }

      if (modeForLeaderboard) {
        try {
          await this.leaderboardRepository.insertFromSession({
            user_id: session.user_id,
            mode: modeForLeaderboard,
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

      try {
        await this.leaderboardRepository.insertFromSession({
          user_id: session.user_id,
          mode: 'global',
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

    let xpDelta = 0;

    if (status === 'completed') {
      if (session.mode === 'classic') {
        xpDelta =
          classicSummary && session.user_id
            ? classicXpEligible
              ? Number(classicXpValue) || 0
              : 0
            : Number(updated.score_total) || 0;
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
      ...(storySummary ? { story: storySummary } : {}),
      ...(classicSummary ? { classic: classicSummary } : {}),
      warnings,
    };
  }
}

