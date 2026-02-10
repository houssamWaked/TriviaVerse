/**
 * Admin service for managing story levels and global question pools.
 */
import AppError from '../utils/AppError.js';

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export class AdminService {
  constructor({
    storyLevelRepository,
    storyLevelPoolRepository,
    quizQuestionRepository,
    questionOptionRepository,
    modeQuestionPoolRepository,
    categoryRepository,
    classicCategoryPoolRepository,
    sessionQuestionRepository,
    userStoryProgressRepository,
    storySessionRepository,
    quizRepository,
    quizAccessRepository,
    quizRatingRepository,
    quizScoreRepository,
    gameSessionRepository,
    quizReportRepository,
    userRepository,
  }) {
    this.storyLevelRepository = storyLevelRepository;
    this.storyLevelPoolRepository = storyLevelPoolRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.modeQuestionPoolRepository = modeQuestionPoolRepository;
    this.categoryRepository = categoryRepository;
    this.classicCategoryPoolRepository = classicCategoryPoolRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
    this.storySessionRepository = storySessionRepository;

    // moderation (optional; only used for new admin endpoints)
    this.quizRepository = quizRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.quizReportRepository = quizReportRepository;
    this.userRepository = userRepository;
  }

  async listQuizReports(query = {}) {
    if (!this.quizReportRepository) {
      throw new AppError('Quiz reports are not configured', 501, 'NOT_CONFIGURED');
    }

    const status = String(query.status || 'open').trim();
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const offset = Math.max(0, Number(query.offset) || 0);

    const rows = await this.quizReportRepository.list({ status, limit, offset });

    const quizIds = Array.from(new Set(rows.map((r) => r.quiz_id).filter(Boolean)));
    const reporterIds = Array.from(new Set(rows.map((r) => r.reporter_user_id).filter(Boolean)));

    const quizzes = this.quizRepository ? await this.quizRepository.findByIds(quizIds) : [];
    const quizMap = new Map((quizzes || []).map((q) => [q.id, q]));

    const ownerIds = Array.from(
      new Set((quizzes || []).map((q) => q.owner_user_id).filter(Boolean))
    );
    const users = this.userRepository
      ? await this.userRepository.findByIds(Array.from(new Set([...reporterIds, ...ownerIds])))
      : [];
    const userMap = new Map((users || []).map((u) => [u.id, u]));

    return {
      entries: (rows || []).map((r) => {
        const quiz = quizMap.get(r.quiz_id) || null;
        const reporter = userMap.get(r.reporter_user_id) || null;
        const owner = quiz?.owner_user_id ? userMap.get(quiz.owner_user_id) || null : null;
        return {
          id: r.id,
          quiz_id: r.quiz_id,
          reporter_user_id: r.reporter_user_id,
          reason: r.reason || 'other',
          message: r.message || null,
          status: r.status,
          created_at: r.created_at,
          resolved_at: r.resolved_at || null,
          quiz: quiz
            ? {
                id: quiz.id,
                title: quiz.title,
                status: quiz.status,
                visibility: quiz.visibility,
                owner_user_id: quiz.owner_user_id,
              }
            : null,
          reporter: reporter
            ? { id: reporter.id, username: reporter.username, email: reporter.email }
            : null,
          owner: owner ? { id: owner.id, username: owner.username, email: owner.email } : null,
        };
      }),
    };
  }

  async resolveQuizReport(reportId, { adminEmail = null } = {}) {
    if (!this.quizReportRepository) {
      throw new AppError('Quiz reports are not configured', 501, 'NOT_CONFIGURED');
    }
    const id = String(reportId || '').trim();
    if (!id) throw new AppError('Report not found', 404, 'NOT_FOUND');

    const updated = await this.quizReportRepository.resolve(id, { adminEmail });
    if (!updated) throw new AppError('Report not found', 404, 'NOT_FOUND');
    return { success: true };
  }

  async deleteCustomQuizAsAdmin(quizId) {
    const qid = String(quizId || '').trim();
    if (!qid) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (!this.quizRepository) throw new AppError('Not configured', 501, 'NOT_CONFIGURED');

    const quiz = await this.quizRepository.findById(qid);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    // Reduce chance of FK violations if game_sessions references quizzes.
    try {
      await this.gameSessionRepository?.clearQuizIdForQuiz(qid);
    } catch {
      // best-effort; continue with deletion attempt
    }

    // Clean related tables if configured (safe to ignore when missing).
    try {
      await this.quizAccessRepository?.deleteByQuizId(qid);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    try {
      await this.quizRatingRepository?.deleteByQuizId(qid);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    try {
      await this.quizScoreRepository?.deleteByQuizId(qid);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    const questions = await this.quizQuestionRepository.listByQuizId(qid);
    const questionIds = questions.map((q) => q.id).filter(Boolean);

    try {
      await this.storyLevelPoolRepository?.deleteByQuizQuestionIds(questionIds);
    } catch {
      // best-effort
    }
    try {
      await this.sessionQuestionRepository?.clearSourceQuestionIds(questionIds);
    } catch {
      // best-effort
    }

    await this.questionOptionRepository.deleteByQuestionIds(questionIds);
    await this.quizQuestionRepository.deleteByQuizId(qid);

    try {
      await this.quizReportRepository?.deleteByQuizId(qid);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ok = await this.quizRepository.delete(qid);
    if (!ok) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return { success: true };
  }

  async banUser(userId, { reason = null, adminEmail = null } = {}) {
    if (!this.userRepository) throw new AppError('Not configured', 501, 'NOT_CONFIGURED');
    const uid = String(userId || '').trim();
    if (!uid) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updated = await this.userRepository.banUser(uid, { reason, adminEmail });
    if (!updated) throw new AppError('User not found', 404, 'NOT_FOUND');
    return { success: true };
  }

  async unbanUser(userId, { adminEmail = null } = {}) {
    if (!this.userRepository) throw new AppError('Not configured', 501, 'NOT_CONFIGURED');
    const uid = String(userId || '').trim();
    if (!uid) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updated = await this.userRepository.unbanUser(uid, { adminEmail });
    if (!updated) throw new AppError('User not found', 404, 'NOT_FOUND');
    return { success: true };
  }

  async assertNotInStoryPool(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return;

    const assignments = await this.storyLevelPoolRepository.listAssignmentsByQuestionIds(ids);
    if (!Array.isArray(assignments) || assignments.length === 0) return;

    throw new AppError(
      'Some questions are already assigned to story mode. Remove them from story levels first.',
      409,
      'POOL_CONFLICT',
      { story_assignments: assignments }
    );
  }

  async assertExclusiveForStoryLevel(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return;

    const [storyAssignments, modeAssignments, classicAssignments] = await Promise.all([
      this.storyLevelPoolRepository.listAssignmentsByQuestionIds(ids),
      this.modeQuestionPoolRepository.listAssignmentsByQuestionIds(ids),
      this.classicCategoryPoolRepository.listAssignmentsByQuestionIds(ids),
    ]);

    const storyConflicts = Array.isArray(storyAssignments)
      ? storyAssignments.filter((a) => a?.level_id && a.level_id !== lid)
      : [];

    const modeConflicts = Array.isArray(modeAssignments) ? modeAssignments : [];
    const classicConflicts = Array.isArray(classicAssignments) ? classicAssignments : [];

    if (storyConflicts.length > 0 || modeConflicts.length > 0 || classicConflicts.length > 0) {
      throw new AppError(
        'Some questions are already assigned to another pool. Remove them before adding to this story level.',
        409,
        'POOL_CONFLICT',
        {
          story_level_conflicts: storyConflicts,
          mode_conflicts: modeConflicts,
          classic_category_conflicts: classicConflicts,
        }
      );
    }
  }

  async filterEligibleForStoryLevel(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return [];

    const [storyAssignments, modeAssignments, classicAssignments] = await Promise.all([
      this.storyLevelPoolRepository.listAssignmentsByQuestionIds(ids),
      this.modeQuestionPoolRepository.listAssignmentsByQuestionIds(ids),
      this.classicCategoryPoolRepository.listAssignmentsByQuestionIds(ids),
    ]);

    const blocked = new Set();

    if (Array.isArray(storyAssignments)) {
      for (const a of storyAssignments) {
        if (!a?.quiz_question_id) continue;
        if (a.level_id && a.level_id !== lid) blocked.add(a.quiz_question_id);
      }
    }

    if (Array.isArray(modeAssignments)) {
      for (const a of modeAssignments) {
        if (a?.quiz_question_id) blocked.add(a.quiz_question_id);
      }
    }

    if (Array.isArray(classicAssignments)) {
      for (const a of classicAssignments) {
        if (a?.quiz_question_id) blocked.add(a.quiz_question_id);
      }
    }

    return ids.filter((id) => !blocked.has(id));
  }

  async filterOutStoryAssigned(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const assignments = await this.storyLevelPoolRepository.listAssignmentsByQuestionIds(ids);
    const blocked = new Set(
      (assignments || []).map((a) => a?.quiz_question_id).filter(Boolean)
    );
    return ids.filter((id) => !blocked.has(id));
  }

  async listStoryLevels() {
    const levels = await this.storyLevelRepository.listAll();

    const withCounts = await Promise.all(
      levels.map(async (lvl) => {
        try {
          const ids = await this.storyLevelPoolRepository.listQuestionIdsByLevelId(lvl.id);
          return { ...lvl, pool_count: ids.length };
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED') throw err;
          return { ...lvl, pool_count: null };
        }
      })
    );

    return withCounts;
  }

  async createStoryLevel(payload) {
    const nextNumber =
      payload.level_number ?? ((await this.storyLevelRepository.getMaxLevelNumber()) || 0) + 1;

    const created = await this.storyLevelRepository.create({
      level_number: nextNumber,
      title: payload.title,
      difficulty_min: payload.difficulty_min ?? 1,
      difficulty_max: payload.difficulty_max ?? 3,
      pass_score_min: payload.pass_score_min ?? 0,
      xp_reward: payload.xp_reward ?? 100,
    });

    if (!created) throw new AppError('Failed to create level', 500, 'DB_ERROR');
    return created;
  }

  async deleteStoryLevel(levelId) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    // Best-effort cleanup of related tables.
    try {
      await this.storyLevelPoolRepository.deleteAllByLevelId(level.id);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    try {
      await this.userStoryProgressRepository?.deleteByLevelId(level.id);
    } catch {
      // best-effort (progress data is optional for admin delete)
    }

    try {
      await this.storySessionRepository?.deleteByLevelId(level.id);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ok = await this.storyLevelRepository.delete(level.id);
    return { success: !!ok };
  }

  async addStoryLevelPool(levelId, questionIds = []) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, added_count: 0 };

    await this.assertExclusiveForStoryLevel(level.id, ids);
    await this.storyLevelPoolRepository.upsertMany(level.id, ids);
    return { success: true, added_count: ids.length };
  }

  async listStoryLevelPoolQuestions(levelId, { limit = 50, offset = 0 } = {}) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = await this.storyLevelPoolRepository.listQuestionIdsByLevelIdPaged(level.id, {
      limit,
      offset,
    });
    const questions = await this.quizQuestionRepository.listByIds(ids);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return {
      level_id: level.id,
      level_number: level.level_number,
      title: level.title,
      limit: Math.min(100, Math.max(1, Number(limit) || 50)),
      offset: Math.max(0, Number(offset) || 0),
      questions: ids
        .map((id) => questionMap.get(id))
        .filter(Boolean)
        .map((q) => ({
          id: q.id,
          question_text: q.question_text,
          difficulty_rating: q.difficulty_rating ?? null,
      })),
    };
  }

  async listStoryLevelPoolQuestionIds(levelId) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = await this.storyLevelPoolRepository.listQuestionIdsByLevelId(level.id);
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    return { level_id: level.id, count: unique.length, ids: unique };
  }

  async listStoryAssignedQuestionIds() {
    const ids = await this.storyLevelPoolRepository.listAllQuestionIds();
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    return { count: unique.length, ids: unique };
  }

  async removeStoryLevelPoolQuestions(levelId, questionIds = []) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, removed_count: 0 };

    await this.storyLevelPoolRepository.deleteMany(level.id, ids);
    return { success: true, removed_count: ids.length };
  }

  async replaceStoryLevelPool(levelId, questionIds = []) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    await this.assertExclusiveForStoryLevel(level.id, ids);
    await this.storyLevelPoolRepository.deleteAllByLevelId(level.id);
    if (ids.length > 0) await this.storyLevelPoolRepository.upsertMany(level.id, ids);
    return { success: true, count: ids.length };
  }

  async seedStoryLevelPool(levelId, { random_count = 10 } = {}) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const count = Math.min(50, Math.max(1, Number(random_count) || 10));
    let questions;
    try {
      questions = await this.quizQuestionRepository.listRandomGlobalByDifficultyRange(count, {
        min: level.difficulty_min ?? 1,
        max: level.difficulty_max ?? 10,
      });
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
      questions = await this.quizQuestionRepository.listRandomGlobal(count);
    }
    const ids = questions.map((q) => q.id).filter(Boolean);
    if (ids.length === 0) throw new AppError('No global questions available', 400, 'NO_POOL');

    const eligible = await this.filterEligibleForStoryLevel(level.id, ids);
    if (eligible.length === 0) {
      throw new AppError(
        'No eligible global questions available (some are already assigned to other pools)',
        400,
        'NO_POOL'
      );
    }

    await this.storyLevelPoolRepository.upsertMany(level.id, eligible);
    return { success: true, added_count: eligible.length };
  }

  async createGlobalQuestion(payload) {
    const options = Array.isArray(payload.options) ? payload.options : [];
    if (options.length < 2) {
      throw new AppError('Provide at least 2 options', 400, 'VALIDATION_ERROR');
    }

    const correctCount = options.filter((o) => !!o.is_correct).length;
    if (correctCount !== 1) {
      throw new AppError('Provide exactly 1 correct option', 400, 'VALIDATION_ERROR');
    }

    const rating = Math.min(10, Math.max(1, Number(payload.difficulty_rating) || 5));

    let created;
    try {
      created = await this.quizQuestionRepository.create({
        quiz_id: null,
        question_text: payload.question_text,
        difficulty_rating: rating,
        explanation: payload.explanation ?? null,
        time_limit_sec: payload.time_limit_sec ?? 30,
        points: payload.points ?? 100,
        order_index: 1,
      });
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
    if (!created) throw new AppError('Failed to create question', 500, 'DB_ERROR');

    const rows = options.map((o, idx) => ({
      question_id: created.id,
      option_text: String(o.option_text || '').trim(),
      is_correct: !!o.is_correct,
      order_index: idx + 1,
    }));

    await this.questionOptionRepository.createMany(rows);

    const modes = Array.isArray(payload.modes)
      ? payload.modes.map((m) => String(m || '').trim().toLowerCase()).filter(Boolean)
      : [];

    for (const m of modes) {
      // eslint-disable-next-line no-await-in-loop
      await this.modeQuestionPoolRepository.upsertMany(m, [created.id]);
    }

    return { question_id: created.id };
  }

  async listGlobalQuestions({ q = '', limit = 20, offset = 0 } = {}) {
    const rows = await this.quizQuestionRepository.listGlobal({ q, limit, offset });
    return {
      q: String(q || '').trim(),
      limit: Math.min(50, Math.max(1, Number(limit) || 20)),
      offset: Math.max(0, Number(offset) || 0),
      results: rows.map((r) => ({
        id: r.id,
        question_text: r.question_text,
        difficulty_rating: r.difficulty_rating ?? null,
      })),
    };
  }

  async addQuestionsToModePool(mode, questionIds = []) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, added_count: 0 };

    await this.assertNotInStoryPool(ids);
    await this.modeQuestionPoolRepository.upsertMany(m, ids);
    return { success: true, added_count: ids.length };
  }

  async removeModePoolQuestions(mode, questionIds = []) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, removed_count: 0 };

    await this.modeQuestionPoolRepository.deleteMany(m, ids);
    return { success: true, removed_count: ids.length };
  }

  async replaceModePool(mode, questionIds = []) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    await this.assertNotInStoryPool(ids);
    await this.modeQuestionPoolRepository.deleteAllByMode(m);
    if (ids.length > 0) await this.modeQuestionPoolRepository.upsertMany(m, ids);
    return { success: true, count: ids.length };
  }

  async searchGlobalQuestions({ q, limit = 20 }) {
    const query = String(q || '').trim();
    if (!query) return { q: '', results: [] };
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));

    const results = await this.quizQuestionRepository.searchGlobalByText({ q: query, limit: lim });
    return {
      q: query,
      results: results.map((r) => ({
        id: r.id,
        question_text: r.question_text,
        difficulty_rating: r.difficulty_rating ?? null,
      })),
    };
  }

  async listModePool(mode) {
    const ids = await this.modeQuestionPoolRepository.listQuestionIdsByMode(mode);
    const copy = ids.slice();
    shuffleInPlace(copy);
    return { mode: String(mode || '').trim().toLowerCase(), count: copy.length };
  }

  async listModePoolQuestionIds(mode) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const ids = await this.modeQuestionPoolRepository.listQuestionIdsByMode(m);
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    return { mode: m, count: unique.length, ids: unique };
  }

  async seedModePool(mode, { random_count = 10 } = {}) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const count = Math.min(100, Math.max(1, Number(random_count) || 10));
    const questions = await this.quizQuestionRepository.listRandomGlobal(count);
    const ids = questions.map((q) => q.id).filter(Boolean);
    if (ids.length === 0) throw new AppError('No global questions available', 400, 'NO_POOL');

    const eligible = await this.filterOutStoryAssigned(ids);
    if (eligible.length === 0) {
      throw new AppError(
        'No eligible global questions available (some are already assigned to story mode)',
        400,
        'NO_POOL'
      );
    }

    await this.modeQuestionPoolRepository.upsertMany(m, eligible);
    return { success: true, added_count: eligible.length };
  }

  async listModePoolQuestions(mode, { limit = 50, offset = 0 } = {}) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const ids = await this.modeQuestionPoolRepository.listQuestionIdsByModePaged(m, {
      limit,
      offset,
    });

    const questions = await this.quizQuestionRepository.listByIds(ids);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return {
      mode: m,
      limit: Math.min(100, Math.max(1, Number(limit) || 50)),
      offset: Math.max(0, Number(offset) || 0),
      questions: ids
        .map((id) => questionMap.get(id))
        .filter(Boolean)
        .map((q) => ({
          id: q.id,
          question_text: q.question_text,
          difficulty_rating: q.difficulty_rating ?? null,
        })),
    };
  }

  async listClassicCategories() {
    const rows = await this.categoryRepository.findAll();

    const withCounts = await Promise.all(
      rows.map(async (c) => {
        try {
          const count = await this.classicCategoryPoolRepository.countByCategoryId(c.id);
          return { id: c.id, name: c.name, icon: c.icon ?? null, pool_count: count };
        } catch (err) {
          if (err?.code !== 'NOT_CONFIGURED') throw err;
          return { id: c.id, name: c.name, icon: c.icon ?? null, pool_count: null };
        }
      })
    );

    return withCounts;
  }

  async createClassicCategory(payload) {
    const created = await this.categoryRepository.create({
      name: payload.name,
      icon: payload.icon ?? null,
    });
    return { id: created.id, name: created.name, icon: created.icon ?? null };
  }

  async deleteClassicCategory(categoryId) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ok = await this.categoryRepository.delete(cat.id);
    return { success: !!ok };
  }

  async listClassicCategoryPoolQuestions(categoryId, { limit = 50, offset = 0 } = {}) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = await this.classicCategoryPoolRepository.listQuestionIdsByCategoryIdPaged(cat.id, {
      limit,
      offset,
    });
    const questions = await this.quizQuestionRepository.listByIds(ids);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return {
      category_id: cat.id,
      name: cat.name,
      limit: Math.min(100, Math.max(1, Number(limit) || 50)),
      offset: Math.max(0, Number(offset) || 0),
      questions: ids
        .map((id) => questionMap.get(id))
        .filter(Boolean)
        .map((q) => ({
          id: q.id,
          question_text: q.question_text,
          difficulty_rating: q.difficulty_rating ?? null,
        })),
    };
  }

  async listClassicCategoryPoolQuestionIds(categoryId) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = await this.classicCategoryPoolRepository.listQuestionIdsByCategoryId(cat.id);
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    return { category_id: cat.id, count: unique.length, ids: unique };
  }

  async addClassicCategoryPool(categoryId, questionIds = []) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, added_count: 0 };

    await this.assertNotInStoryPool(ids);
    await this.classicCategoryPoolRepository.upsertMany(cat.id, ids);
    return { success: true, added_count: ids.length };
  }

  async removeClassicCategoryPool(categoryId, questionIds = []) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, removed_count: 0 };

    await this.classicCategoryPoolRepository.deleteMany(cat.id, ids);
    return { success: true, removed_count: ids.length };
  }

  async replaceClassicCategoryPool(categoryId, questionIds = []) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    await this.assertNotInStoryPool(ids);
    await this.classicCategoryPoolRepository.deleteAllByCategoryId(cat.id);
    if (ids.length > 0) await this.classicCategoryPoolRepository.upsertMany(cat.id, ids);
    return { success: true, count: ids.length };
  }

  async seedClassicCategoryPool(categoryId, { random_count = 10 } = {}) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const count = Math.min(100, Math.max(1, Number(random_count) || 10));

    // Prefer drawing from classic mode pool (if configured), otherwise global random.
    let ids = [];
    try {
      const fromMode = await this.modeQuestionPoolRepository.listQuestionIdsByMode('classic');
      if (fromMode.length > 0) {
        const shuffled = fromMode.slice();
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        ids = shuffled.slice(0, Math.min(count, shuffled.length));
      }
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    if (ids.length > 0) {
      // Exclude story-assigned questions from the classic seed.
      // eslint-disable-next-line no-await-in-loop
      ids = await this.filterOutStoryAssigned(ids);
    }

    if (ids.length === 0) {
      const questions = await this.quizQuestionRepository.listRandomGlobal(count);
      const raw = questions.map((q) => q.id).filter(Boolean);
      ids = await this.filterOutStoryAssigned(raw);
    }

    if (ids.length === 0) throw new AppError('No global questions available', 400, 'NO_POOL');

    await this.classicCategoryPoolRepository.upsertMany(cat.id, ids);
    return { success: true, added_count: ids.length };
  }

  async deleteGlobalQuestion(questionId) {
    const qid = String(questionId || '').trim();
    if (!qid) throw new AppError('Invalid question_id', 400, 'INVALID_INPUT');

    const q = await this.quizQuestionRepository.findById(qid);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    if (q.quiz_id != null) {
      throw new AppError('Only global questions can be deleted here', 400, 'INVALID_INPUT');
    }

    // Remove from any pools + preserve session snapshots (best-effort).
    await Promise.allSettled([
      this.storyLevelPoolRepository?.deleteByQuizQuestionIds?.([qid]),
      this.modeQuestionPoolRepository?.deleteByQuizQuestionIds?.([qid]),
      this.classicCategoryPoolRepository?.deleteByQuizQuestionIds?.([qid]),
      this.sessionQuestionRepository?.clearSourceQuestionIds?.([qid]),
    ]);

    await this.questionOptionRepository.deleteByQuestionId(qid);
    const ok = await this.quizQuestionRepository.delete(qid);
    if (!ok) throw new AppError('Question not found', 404, 'NOT_FOUND');

    return { success: true };
  }
}
