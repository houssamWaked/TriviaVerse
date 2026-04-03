/**
 * Classic category levels service (classic becomes story-like per category).
 */
import AppError from '../utils/AppError.js';

type ClassicLevelLike = {
  id: string;
  level_number: number;
  title: string;
  difficulty_max: number | null;
};

type ClassicProgressLike = {
  id: string;
  level_id: string;
  best_score: number | null;
  stars_earned: number | null;
  is_unlocked: boolean | null;
  is_completed: boolean | null;
};

type ClassicCategoryLevelRepositoryLike = {
  listByCategoryId(categoryId: string): Promise<ClassicLevelLike[]>;
};

type UserClassicProgressRepositoryLike = {
  listByUserAndLevelIds(userId: string, levelIds: string[]): Promise<ClassicProgressLike[]>;
  ensureUnlocked(userId: string, levelId: string): Promise<ClassicProgressLike | null>;
  findByUserAndLevelId(userId: string, levelId: string): Promise<ClassicProgressLike | null>;
  bumpAttempts(progressId: string): Promise<ClassicProgressLike | null>;
};

export class ClassicCategoryService {
  classicCategoryLevelRepository: ClassicCategoryLevelRepositoryLike;
  userClassicProgressRepository: UserClassicProgressRepositoryLike;

  constructor(
    classicCategoryLevelRepository: ClassicCategoryLevelRepositoryLike,
    userClassicProgressRepository: UserClassicProgressRepositoryLike
  ) {
    this.classicCategoryLevelRepository = classicCategoryLevelRepository;
    this.userClassicProgressRepository = userClassicProgressRepository;
  }

  async listLevels(categoryId: string): Promise<ClassicLevelLike[]> {
    return this.classicCategoryLevelRepository.listByCategoryId(categoryId);
  }

  async getUserProgress(userId: string, categoryId: string) {
    const levels = await this.classicCategoryLevelRepository.listByCategoryId(categoryId);
    const levelIds = levels.map((level) => level.id).filter(Boolean);
    let progress = await this.userClassicProgressRepository.listByUserAndLevelIds(userId, levelIds);

    if (levels.length > 0) {
      const first = levels[0];
      const hasFirst = progress.some((item) => item.level_id === first.id);
      if (!hasFirst) {
        await this.userClassicProgressRepository.ensureUnlocked(userId, first.id);
        progress = await this.userClassicProgressRepository.listByUserAndLevelIds(userId, levelIds);
      }
    }

    const progressByLevelId = new Map(progress.map((item) => [item.level_id, item]));
    const completed_levels = progress.filter((item) => item.is_completed).length;

    return {
      category_id: categoryId,
      completed_levels,
      total_levels: levels.length,
      levels: levels.map((level) => {
        const item = progressByLevelId.get(level.id);
        return {
          level_id: level.id,
          level_number: level.level_number,
          title: level.title,
          difficulty:
            (level.difficulty_max ?? 0) <= 3 ? 'easy' : (level.difficulty_max ?? 0) <= 6 ? 'medium' : 'hard',
          best_score: item?.best_score ?? 0,
          stars_earned: item?.stars_earned ?? 0,
          is_unlocked: item?.is_unlocked ?? false,
          is_completed: item?.is_completed ?? false,
        };
      }),
    };
  }

  async assertLevelUnlocked(userId: string, level: ClassicLevelLike): Promise<ClassicProgressLike | null> {
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
