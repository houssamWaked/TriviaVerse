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
  }) {
    this.storyLevelRepository = storyLevelRepository;
    this.storyLevelPoolRepository = storyLevelPoolRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.modeQuestionPoolRepository = modeQuestionPoolRepository;
    this.categoryRepository = categoryRepository;
    this.classicCategoryPoolRepository = classicCategoryPoolRepository;
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

  async addStoryLevelPool(levelId, questionIds = []) {
    const level = await this.storyLevelRepository.findById(levelId);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, added_count: 0 };

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

    await this.storyLevelPoolRepository.upsertMany(level.id, ids);
    return { success: true, added_count: ids.length };
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

  async seedModePool(mode, { random_count = 10 } = {}) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) throw new AppError('Mode is required', 400, 'VALIDATION_ERROR');

    const count = Math.min(100, Math.max(1, Number(random_count) || 10));
    const questions = await this.quizQuestionRepository.listRandomGlobal(count);
    const ids = questions.map((q) => q.id).filter(Boolean);
    if (ids.length === 0) throw new AppError('No global questions available', 400, 'NO_POOL');

    await this.modeQuestionPoolRepository.upsertMany(m, ids);
    return { success: true, added_count: ids.length };
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

  async addClassicCategoryPool(categoryId, questionIds = []) {
    const cat = await this.categoryRepository.findById(categoryId);
    if (!cat) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return { success: true, added_count: 0 };

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

    if (ids.length === 0) {
      const questions = await this.quizQuestionRepository.listRandomGlobal(count);
      ids = questions.map((q) => q.id).filter(Boolean);
    }

    if (ids.length === 0) throw new AppError('No global questions available', 400, 'NO_POOL');

    await this.classicCategoryPoolRepository.upsertMany(cat.id, ids);
    return { success: true, added_count: ids.length };
  }
}
