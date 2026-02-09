/**
 * Session start service for different game modes.
 *
 * Pool selection:
 * - If `mode_question_pool` is configured, classic/blitz/millionaire pull only from their assigned pools.
 * - If it's not configured, we fall back to random questions from `quiz_questions`.
 *
 * NOTE: `quiz_questions` does not include `category_id` for global questions, so classic/blitz/millionaire
 * cannot strictly filter by category without a separate mapping table. The requested `category_id`/`difficulty`
 * are still stored on the created `game_sessions` row for future filtering.
 */
import AppError from '../utils/AppError.js';
import { sessionCache } from '../utils/sessionCache.js';
import { randomUUID } from 'node:crypto';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function difficultyToRatingRange(difficulty) {
  const d = String(difficulty || '').trim().toLowerCase();
  if (d === 'easy') return { min: 1, max: 4 };
  if (d === 'medium') return { min: 4, max: 7 };
  if (d === 'hard') return { min: 8, max: 10 };
  return null;
}

function inRatingRange(question, range) {
  if (!range) return true;
  const r = Number(question?.difficulty_rating);
  if (!Number.isFinite(r)) return false;
  return r >= range.min && r <= range.max;
}

export class SessionStartService {
  constructor({
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    quizQuestionRepository,
    questionOptionRepository,
    quizRepository,
    quizAccessRepository,
    friendRepository,
    storySessionRepository,
    storyLevelRepository,
    storyLevelPoolRepository,
    storyService,
    millionaireLadderRepository,
    modeQuestionPoolRepository,
    classicCategoryPoolRepository,
  }) {
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.quizRepository = quizRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.friendRepository = friendRepository;
    this.storySessionRepository = storySessionRepository;
    this.storyLevelRepository = storyLevelRepository;
    this.storyLevelPoolRepository = storyLevelPoolRepository;
    this.storyService = storyService;
    this.millionaireLadderRepository = millionaireLadderRepository;
    this.modeQuestionPoolRepository = modeQuestionPoolRepository;
    this.classicCategoryPoolRepository = classicCategoryPoolRepository;
  }

  async listQuestionsForMode(mode, limit) {
    const count = Math.max(1, Number(limit) || 1);

    if (this.modeQuestionPoolRepository) {
      try {
        const ids = await this.modeQuestionPoolRepository.listQuestionIdsByMode(mode);
        if (ids.length === 0) {
          throw new AppError(
            `No questions configured for ${mode} mode yet. Add questions to the ${mode} pool in Admin.`,
            400,
            'NO_POOL'
          );
        }

        // Important: never mix in unrelated global questions when the mode pool is configured.
        // Also, avoid selecting "missing" pool rows by continuing through shuffled ids until
        // we have enough real `quiz_questions` rows.
        const shuffled = ids.slice();
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const picked = [];
        const pickedIds = new Set();
        const batchSize = 200;
        for (let off = 0; off < shuffled.length && picked.length < count; off += batchSize) {
          const batchIds = shuffled.slice(off, off + batchSize);
          // eslint-disable-next-line no-await-in-loop
          const rows = await this.quizQuestionRepository.listByIds(batchIds);
          const map = new Map(rows.map((q) => [q.id, q]));
          for (const id of batchIds) {
            const q = map.get(id);
            if (!q) continue;
            if (pickedIds.has(q.id)) continue;
            pickedIds.add(q.id);
            picked.push(q);
            if (picked.length >= count) break;
          }
        }

        if (picked.length < count) {
          throw new AppError(
            `Not enough questions configured for ${mode} mode (have ${picked.length}, need ${count}). Add more questions to the ${mode} pool in Admin.`,
            400,
            'NOT_ENOUGH_QUESTIONS'
          );
        }

        return picked.slice(0, count);
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    // Back-compat fallback: when admin pools aren't configured, keep using the
    // existing global randomness (which may include custom quiz questions).
    return this.quizQuestionRepository.listRandom(count);
  }

  async listQuestionsForModeByDifficulty(mode, limit, difficulty) {
    const count = Math.max(1, Number(limit) || 1);
    const range = difficultyToRatingRange(difficulty);
    if (!range) return this.listQuestionsForMode(mode, count);

    const picked = [];
    const pickedIds = new Set();
    let poolConfigured = false;
    let poolHadRows = false;

    if (this.modeQuestionPoolRepository) {
      try {
        const ids = await this.modeQuestionPoolRepository.listQuestionIdsByMode(mode);
        poolConfigured = true;
        poolHadRows = ids.length > 0;
        if (ids.length > 0) {
          const shuffled = ids.slice();
          for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          const batchSize = 200;
          for (let off = 0; off < shuffled.length && picked.length < count; off += batchSize) {
            const batchIds = shuffled.slice(off, off + batchSize);
            // eslint-disable-next-line no-await-in-loop
            const rows = await this.quizQuestionRepository.listByIds(batchIds);
            const map = new Map(rows.map((q) => [q.id, q]));
            for (const id of batchIds) {
              const q = map.get(id);
              if (!q) continue;
              if (!inRatingRange(q, range)) continue;
              if (pickedIds.has(q.id)) continue;
              pickedIds.add(q.id);
              picked.push(q);
              if (picked.length >= count) break;
            }
          }
        }
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    if (picked.length >= count) return picked.slice(0, count);

    // If the admin mode pool is configured, do not mix in unrelated global questions.
    if (poolConfigured) {
      if (!poolHadRows) {
        throw new AppError(
          `No questions configured for ${mode} mode yet. Add questions to the ${mode} pool in Admin.`,
          400,
          'NO_POOL'
        );
      }
      return picked.slice(0, count);
    }

    // Otherwise fill from global bank (difficulty-filtered). If difficulty column isn't configured,
    // we fail loudly (user selected a difficulty).
    const missing = Math.max(0, count - picked.length);
    try {
      const filler = await this.quizQuestionRepository.listRandomGlobalByDifficultyRange(missing, range);
      for (const q of filler) {
        if (!q?.id) continue;
        if (pickedIds.has(q.id)) continue;
        pickedIds.add(q.id);
        picked.push(q);
      }
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') {
        throw new AppError(
          'Difficulty rating is not configured. Run `api/sql/quiz_questions_difficulty_rating.sql` in Supabase first.',
          501,
          'NOT_CONFIGURED'
        );
      }
      throw err;
    }

    return picked.slice(0, count);
  }

  async listQuestionsForClassic({ category_id = null, limit }) {
    const count = Math.max(1, Number(limit) || 1);
    const cid = category_id ? String(category_id).trim() : '';

    if (cid && !this.classicCategoryPoolRepository) {
      // If caller explicitly selected a category, do not silently ignore it.
      throw new AppError(
        'Classic categories are not configured on the server',
        501,
        'NOT_CONFIGURED'
      );
    }

    if (cid && this.classicCategoryPoolRepository) {
      try {
        const ids = await this.classicCategoryPoolRepository.listQuestionIdsByCategoryId(cid);
        if (ids.length === 0) {
          // Category selected but no configured pool: do not mix other categories in.
          throw new AppError('No questions configured for this category', 400, 'NO_POOL');
        }
        if (ids.length < count) {
          throw new AppError(
            `Not enough questions configured for this category (have ${ids.length}, need ${count}).`,
            400,
            'NOT_ENOUGH_QUESTIONS'
          );
        }

        const shuffled = ids.slice();
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const pickedIds = shuffled.slice(0, Math.min(count, shuffled.length));
        const pickedRows = await this.quizQuestionRepository.listByIds(pickedIds);
        const map = new Map(pickedRows.map((q) => [q.id, q]));
        const picked = pickedIds.map((id) => map.get(id)).filter(Boolean);

        if (picked.length < count) {
          throw new AppError(
            'Some questions in this category pool no longer exist. Please rebuild the pool.',
            400,
            'POOL_CORRUPT'
          );
        }

        // IMPORTANT: Only return questions from the selected category pool.
        return picked;
      } catch (err) {
        // When a category is explicitly selected, do not fall back to random questions.
        if (err?.code === 'NOT_CONFIGURED') {
          throw new AppError(
            'Classic categories are not configured on the server',
            501,
            'NOT_CONFIGURED'
          );
        }
        throw err;
      }
    }

    return this.listQuestionsForMode('classic', count);
  }

  async assertCanViewQuiz(userId, quiz) {
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.visibility === 'public') return true;
    if (quiz.visibility === 'unlisted') return true;

    if (quiz.visibility === 'private') {
      if (!userId) throw new AppError('Login required', 401, 'UNAUTHORIZED');
      if (quiz.owner_user_id === userId) return true;
      try {
        const isFriend = await this.friendRepository.areFriends(userId, quiz.owner_user_id);
        if (isFriend) return true;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
      try {
        const allowed = await this.quizAccessRepository.listQuizIdsForUser(userId);
        if (allowed.includes(quiz.id)) return true;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  async snapshotSessionQuestions(sessionId, sourceQuestions) {
    const sessionQuestionsRows = sourceQuestions.map((q, idx) => ({
      session_id: sessionId,
      source_question_id: q.id,
      question_text_snapshot: q.question_text,
      order_index: idx + 1,
      points_snapshot: q.points ?? 0,
      time_limit_snapshot: q.time_limit_sec ?? 30,
    }));

    const createdSessionQuestions = await this.sessionQuestionRepository.createMany(
      sessionQuestionsRows
    );

    const bySourceId = new Map(
      createdSessionQuestions.map((sq) => [sq.source_question_id, sq])
    );
    const options = await this.questionOptionRepository.listByQuestionIds(
      sourceQuestions.map((q) => q.id)
    );

    const countsByQuestionId = new Map();
    const correctByQuestionId = new Map();
    for (const opt of options) {
      const qid = opt.question_id;
      if (!qid) continue;
      countsByQuestionId.set(qid, (countsByQuestionId.get(qid) || 0) + 1);
      if (opt.is_correct) {
        correctByQuestionId.set(qid, (correctByQuestionId.get(qid) || 0) + 1);
      }
    }

    for (const q of sourceQuestions) {
      const count = countsByQuestionId.get(q.id) || 0;
      const correct = correctByQuestionId.get(q.id) || 0;
      if (count < 2) {
        throw new AppError(
          `Question ${q.id} must have at least 2 options (currently ${count}).`,
          400,
          'INVALID_QUIZ'
        );
      }
      if (correct !== 1) {
        throw new AppError(
          `Question ${q.id} must have exactly 1 correct option (currently ${correct}).`,
          400,
          'INVALID_QUIZ'
        );
      }
    }

    const optionRows = [];
    for (const opt of options) {
      const sq = bySourceId.get(opt.question_id);
      if (!sq) continue;
      optionRows.push({
        session_question_id: sq.id,
        option_text_snapshot: opt.option_text,
        is_correct_snapshot: opt.is_correct ?? false,
        order_index: opt.order_index,
      });
    }
    await this.sessionOptionRepository.createMany(optionRows);
  }

  async primeSessionCache(session, userId) {
    if (!session?.id || !session?.mode || !userId) return;

    const sessionQuestions = await this.sessionQuestionRepository.listBySessionId(session.id);
    const options = await this.sessionOptionRepository.listBySessionQuestionIds(
      sessionQuestions.map((q) => q.id)
    );

    const bySqId = new Map();
    for (const o of options) {
      const sid = o.session_question_id;
      if (!sid) continue;
      if (!bySqId.has(sid)) bySqId.set(sid, []);
      bySqId.get(sid).push(o);
    }

    const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cachedQuestions = [];
    const correctBySqId = {};

    for (const sq of sessionQuestions) {
      const opts = (bySqId.get(sq.id) || []).slice().sort((a, b) => {
        const x = Number(a.order_index) || 0;
        const y = Number(b.order_index) || 0;
        return x - y;
      });
      const correct = opts.find((o) => !!o.is_correct_snapshot);
      if (correct?.id) correctBySqId[sq.id] = correct.id;

      cachedQuestions.push({
        session_question_id: sq.id,
        mode: session.mode,
        question_number: sq.order_index,
        total_questions: session.total_questions,
        question_text: sq.question_text_snapshot,
        time_limit_sec: sq.time_limit_snapshot,
        points: sq.points_snapshot ?? 0,
        options: opts.map((o) => ({
          id: o.id,
          label: LABELS[(Number(o.order_index) || 1) - 1] || String(o.order_index),
          text: o.option_text_snapshot,
        })),
      });
    }

    sessionCache.set(session.id, {
      mode: session.mode,
      user_id: userId,
      started_at: session.started_at,
      score_total: session.score_total ?? 0,
      wrong_count: 0,
      strike_count: 0,
      question_started_at: new Date().toISOString(),
      status: session.status,
      current_index: 0,
      questions: cachedQuestions,
      correct_option_id_by_session_question_id: correctBySqId,
    });
  }

  async primeGuestSessionCache(sessionId, mode, sourceQuestions, { started_at = null } = {}) {
    if (!sessionId || !mode) return false;
    const questions = Array.isArray(sourceQuestions) ? sourceQuestions : [];
    if (questions.length === 0) {
      throw new AppError('No questions available for this mode', 400, 'NO_POOL');
    }

    const options = await this.questionOptionRepository.listByQuestionIds(
      questions.map((q) => q.id)
    );

    const countsByQuestionId = new Map();
    const correctByQuestionId = new Map();
    for (const opt of options) {
      const qid = opt.question_id;
      if (!qid) continue;
      countsByQuestionId.set(qid, (countsByQuestionId.get(qid) || 0) + 1);
      if (opt.is_correct) {
        correctByQuestionId.set(qid, (correctByQuestionId.get(qid) || 0) + 1);
      }
    }

    for (const q of questions) {
      const count = countsByQuestionId.get(q.id) || 0;
      const correct = correctByQuestionId.get(q.id) || 0;
      if (count < 2) {
        throw new AppError(
          `Question ${q.id} must have at least 2 options (currently ${count}).`,
          400,
          'INVALID_QUIZ'
        );
      }
      if (correct !== 1) {
        throw new AppError(
          `Question ${q.id} must have exactly 1 correct option (currently ${correct}).`,
          400,
          'INVALID_QUIZ'
        );
      }
    }

    const byQuestionId = new Map();
    for (const o of options) {
      const qid = o.question_id;
      if (!qid) continue;
      if (!byQuestionId.has(qid)) byQuestionId.set(qid, []);
      byQuestionId.get(qid).push(o);
    }

    const cachedQuestions = [];
    const correctBySessionQuestionId = {};

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const opts = (byQuestionId.get(q.id) || []).slice().sort((a, b) => {
        const x = Number(a.order_index) || 0;
        const y = Number(b.order_index) || 0;
        return x - y;
      });

      const correct = opts.find((o) => !!o.is_correct);
      if (correct?.id) correctBySessionQuestionId[q.id] = correct.id;

      cachedQuestions.push({
        session_question_id: q.id,
        mode,
        question_number: i + 1,
        total_questions: questions.length,
        question_text: q.question_text,
        time_limit_sec: q.time_limit_sec ?? 30,
        points: q.points ?? 0,
        options: opts.map((o) => ({
          id: o.id,
          order_index: o.order_index,
          label: LABELS[(Number(o.order_index) || 1) - 1] || String(o.order_index),
          text: o.option_text,
        })),
      });
    }

    sessionCache.set(sessionId, {
      is_guest: true,
      mode,
      user_id: null,
      started_at: started_at || new Date().toISOString(),
      score_total: 0,
      wrong_count: 0,
      strike_count: 0,
      question_started_at: new Date().toISOString(),
      status: 'in_progress',
      current_index: 0,
      questions: cachedQuestions,
      correct_option_id_by_session_question_id: correctBySessionQuestionId,
      lifelines: [],
    });

    return true;
  }

  async startStorySession(userId, level_number) {
    const level = await this.storyLevelRepository.findByLevelNumber(level_number);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    if (userId) {
      await this.storyService.assertLevelUnlocked(userId, level);
    }

    const questionIds = await this.storyLevelPoolRepository.listQuestionIdsByLevelId(
      level.id
    );
    if (questionIds.length === 0) {
      throw new AppError('No questions configured for this level', 400, 'NO_POOL');
    }

    const wantedIds = questionIds.slice(0, 10);
    const rows = await this.quizQuestionRepository.listByIds(wantedIds);
    const byId = new Map(rows.map((q) => [q.id, q]));
    const questions = wantedIds.map((id) => byId.get(id)).filter(Boolean);

    let sessionId = null;
    let status = 'in_progress';

    if (userId) {
      const session = await this.gameSessionRepository.create({
        user_id: userId,
        mode: 'story',
        difficulty:
          level.difficulty_max <= 3
            ? 'easy'
            : level.difficulty_max <= 6
              ? 'medium'
              : 'hard',
        total_questions: questions.length,
        status: 'in_progress',
      });
      if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');
      sessionId = session.id;
      status = session.status;

      try {
        await this.storySessionRepository?.create({
          session_id: session.id,
          level_id: level.id,
          level_number: level.level_number,
        });
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
        // If story_sessions isn't configured, gameplay still works but progress unlock won't persist.
      }

      await this.snapshotSessionQuestions(session.id, questions);

      // Cache is an optimization. If it fails, gameplay still works via DB.
      try {
        await this.primeSessionCache(session, userId);
      } catch {
        // ignore
      }
    } else {
      sessionId = randomUUID();
      await this.primeGuestSessionCache(sessionId, 'story', questions);
    }

    return {
      session_id: sessionId,
      mode: 'story',
      level_number,
      status,
      total_questions: questions.length,
    };
  }

  async startMillionaireSession(userId, ladder_id) {
    if (ladder_id) {
      const ladder = await this.millionaireLadderRepository.findById(ladder_id);
      if (!ladder) throw new AppError('Ladder not found', 404, 'NOT_FOUND');
    }

    const questions = await this.listQuestionsForMode('millionaire', 15);
    if (questions.length === 0) {
      throw new AppError('No questions available for this mode', 400, 'NO_POOL');
    }
    let sessionId = null;
    let status = 'in_progress';

    if (userId) {
      const session = await this.gameSessionRepository.create({
        user_id: userId,
        mode: 'millionaire',
        total_questions: questions.length,
        status: 'in_progress',
      });
      if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');
      sessionId = session.id;
      status = session.status;

      await this.snapshotSessionQuestions(session.id, questions);

      // Cache is an optimization. If it fails, gameplay still works via DB.
      try {
        await this.primeSessionCache(session, userId);
      } catch {
        // ignore
      }
    } else {
      sessionId = randomUUID();
      await this.primeGuestSessionCache(sessionId, 'millionaire', questions);
    }

    return {
      session_id: sessionId,
      mode: 'millionaire',
      current_question_index: 1,
      total_questions: questions.length,
      current_prize: 0,
      status,
    };
  }

  async startClassicSession(userId, { category_id, difficulty, questions_count }) {
    const questions = await this.listQuestionsForClassic({
      category_id,
      limit: questions_count,
    });
    if (questions.length === 0) {
      throw new AppError('No questions available for this mode', 400, 'NO_POOL');
    }
    let sessionId = null;
    let status = 'in_progress';

    if (userId) {
      const session = await this.gameSessionRepository.create({
        user_id: userId,
        mode: 'classic',
        category_id,
        difficulty,
        total_questions: questions.length,
        status: 'in_progress',
      });
      if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');
      sessionId = session.id;
      status = session.status;

      await this.snapshotSessionQuestions(session.id, questions);

      // Cache is an optimization. If it fails, gameplay still works via DB.
      try {
        await this.primeSessionCache(session, userId);
      } catch {
        // ignore
      }
    } else {
      sessionId = randomUUID();
      await this.primeGuestSessionCache(sessionId, 'classic', questions);
    }

    return {
      session_id: sessionId,
      mode: 'classic',
      total_questions: questions.length,
      status,
    };
  }

  async startBlitzSession(userId, { category_id, difficulty }) {
    const target = 200;
    const questions = await this.listQuestionsForModeByDifficulty('blitz', target, difficulty);
    if (questions.length < 30) {
      throw new AppError(
        `Not enough ${difficulty} blitz questions available (have ${questions.length}, need at least 30).`,
        400,
        'NOT_ENOUGH_QUESTIONS'
      );
    }
    if (questions.length === 0) {
      throw new AppError('No questions available for this mode', 400, 'NO_POOL');
    }
    let sessionId = null;
    let status = 'in_progress';
    const perQuestionTimeLimitSec = 15;
    const adjustedQuestions = questions.map((q) => ({
      ...q,
      time_limit_sec: perQuestionTimeLimitSec,
    }));

    if (userId) {
      const session = await this.gameSessionRepository.create({
        user_id: userId,
        mode: 'blitz',
        category_id: category_id ?? null,
        difficulty: difficulty ?? null,
        total_questions: adjustedQuestions.length,
        status: 'in_progress',
      });
      if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');
      sessionId = session.id;
      status = session.status;

      await this.snapshotSessionQuestions(session.id, adjustedQuestions);

      // Prime in-memory cache so gameplay can run "flash fast" without DB reads per answer.
      try {
        await this.primeSessionCache(session, userId);
      } catch {
        // Cache is an optimization. If it fails, gameplay still works via DB.
      }
    } else {
      sessionId = randomUUID();
      await this.primeGuestSessionCache(sessionId, 'blitz', adjustedQuestions);
    }

    return {
      session_id: sessionId,
      mode: 'blitz',
      time_limit_sec: perQuestionTimeLimitSec,
      strikes: 3,
      status,
    };
  }

  async startCustomQuizSession(userId, quizId) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.status !== 'published' && quiz.owner_user_id !== userId) {
      throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    }

    await this.assertCanViewQuiz(userId, quiz);

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    if (questions.length === 0) {
      throw new AppError('Quiz has no questions', 400, 'NO_QUESTIONS');
    }

    let sessionId = null;
    let status = 'in_progress';

    if (userId) {
      const session = await this.gameSessionRepository.create({
        user_id: userId,
        mode: 'custom',
        quiz_id: quizId,
        total_questions: questions.length,
        status: 'in_progress',
      });
      if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');
      sessionId = session.id;
      status = session.status;

      await this.snapshotSessionQuestions(session.id, questions);

      // Cache is an optimization. If it fails, gameplay still works via DB.
      try {
        await this.primeSessionCache(session, userId);
      } catch {
        // ignore
      }
    } else {
      sessionId = randomUUID();
      await this.primeGuestSessionCache(sessionId, 'custom', questions);
    }

    return {
      session_id: sessionId,
      mode: 'custom',
      quiz_id: quizId,
      status,
      total_questions: questions.length,
    };
  }
}
