/**
 * Classic category levels service (classic becomes story-like per category).
 */
import AppError from '../utils/AppError.js';

export class ClassicCategoryService {
  constructor(classicCategoryLevelRepository, userClassicProgressRepository) {
    this.classicCategoryLevelRepository = classicCategoryLevelRepository;
    this.userClassicProgressRepository = userClassicProgressRepository;
  }

  async listLevels(categoryId) {
    return await this.classicCategoryLevelRepository.listByCategoryId(categoryId);
  }

  async getUserProgress(userId, categoryId) {
    const levels = await this.classicCategoryLevelRepository.listByCategoryId(categoryId);
    const levelIds = levels.map((l) => l.id).filter(Boolean);

    let progress = await this.userClassicProgressRepository.listByUserAndLevelIds(userId, levelIds);

    // Ensure first level is unlocked for new users (per category).
    if (levels.length > 0) {
      const first = levels[0];
      const hasFirst = progress.some((p) => p.level_id === first.id);
      if (!hasFirst) {
        await this.userClassicProgressRepository.ensureUnlocked(userId, first.id);
        progress = await this.userClassicProgressRepository.listByUserAndLevelIds(userId, levelIds);
      }
    }

    const progressByLevelId = new Map(progress.map((p) => [p.level_id, p]));
    const completed_levels = progress.filter((p) => p.is_completed).length;

    return {
      category_id: categoryId,
      completed_levels,
      total_levels: levels.length,
      levels: levels.map((lvl) => {
        const p = progressByLevelId.get(lvl.id);
        return {
          level_id: lvl.id,
          level_number: lvl.level_number,
          title: lvl.title,
          difficulty:
            lvl.difficulty_max <= 3 ? 'easy' : lvl.difficulty_max <= 6 ? 'medium' : 'hard',
          best_score: p?.best_score ?? 0,
          stars_earned: p?.stars_earned ?? 0,
          is_unlocked: p?.is_unlocked ?? false,
          is_completed: p?.is_completed ?? false,
        };
      }),
    };
  }

  async assertLevelUnlocked(userId, level) {
    let progress = await this.userClassicProgressRepository.findByUserAndLevelId(userId, level.id);

    if (!progress && Number(level.level_number) === 1) {
      progress = await this.userClassicProgressRepository.ensureUnlocked(userId, level.id);
    }

    if (!progress || !progress.is_unlocked) {
      throw new AppError('Level is locked', 403, 'FORBIDDEN');
    }

    await this.userClassicProgressRepository.bumpAttempts(progress.id);
    return progress;
  }
}

