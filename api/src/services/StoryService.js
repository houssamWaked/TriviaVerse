/**
 * Story mode service.
 */
import AppError from '../utils/AppError.js';

export class StoryService {
  constructor(storyLevelRepository, userStoryProgressRepository) {
    this.storyLevelRepository = storyLevelRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
  }

  async listLevels() {
    return await this.storyLevelRepository.listAll();
  }

  async getUserProgress(userId) {
    const [levels, progressRaw] = await Promise.all([
      this.storyLevelRepository.listAll(),
      this.userStoryProgressRepository.listByUserId(userId),
    ]);

    let progress = progressRaw;

    // Ensure the first level is unlocked for new users.
    if (levels.length > 0) {
      const first = levels[0];
      const hasFirst = progress.some((p) => p.level_id === first.id);
      if (!hasFirst) {
        await this.userStoryProgressRepository.ensureUnlocked(userId, first.id);
        // re-fetch so UI gets consistent state
        progress = await this.userStoryProgressRepository.listByUserId(userId);
      }
    }

    const progressByLevelId = new Map(progress.map((p) => [p.level_id, p]));
    const completed_levels = progress.filter((p) => p.is_completed).length;

    return {
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
    let progress = await this.userStoryProgressRepository.findByUserAndLevelId(userId, level.id);

    if (!progress && Number(level.level_number) === 1) {
      progress = await this.userStoryProgressRepository.ensureUnlocked(userId, level.id);
    }

    if (!progress || !progress.is_unlocked) {
      throw new AppError('Level is locked', 403, 'FORBIDDEN');
    }

    await this.userStoryProgressRepository.bumpAttempts(progress.id);
    return progress;
  }
}
