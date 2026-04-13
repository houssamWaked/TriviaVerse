/**
 * Story mode service.
 */
import AppError from '../utils/AppError.js';

type StoryLevelLike = {
  id: string;
  level_number: number;
  title: string;
  difficulty_max: number | null;
};

type StoryProgressLike = {
  id: string;
  level_id: string;
  best_score: number | null;
  stars_earned: number | null;
  is_unlocked: boolean | null;
  is_completed: boolean | null;
};

type StoryLevelRepositoryLike = {
  listAll(): Promise<StoryLevelLike[]>;
};

type UserStoryProgressRepositoryLike = {
  listByUserId(userId: string): Promise<StoryProgressLike[]>;
  ensureUnlocked(userId: string, levelId: string): Promise<StoryProgressLike | null>;
  findByUserAndLevelId(userId: string, levelId: string): Promise<StoryProgressLike | null>;
  bumpAttempts(progressId: string): Promise<StoryProgressLike | null>;
};

export class StoryService {
  storyLevelRepository: StoryLevelRepositoryLike;
  userStoryProgressRepository: UserStoryProgressRepositoryLike;

  /**
   * Construct the story service.
   * @param storyLevelRepository Repository for story level definitions.
   * @param userStoryProgressRepository Repository for per-user story progress rows.
   * @returns A `StoryService` instance.
   */
  constructor(
    storyLevelRepository: StoryLevelRepositoryLike,
    userStoryProgressRepository: UserStoryProgressRepositoryLike
  ) {
    this.storyLevelRepository = storyLevelRepository;
    this.userStoryProgressRepository = userStoryProgressRepository;
  }

  /**
   * List all story levels.
   * @returns Array of story levels.
   */
  async listLevels(): Promise<StoryLevelLike[]> {
    return this.storyLevelRepository.listAll();
  }

  /**
   * Get a user's story progress (unlocks level 1 if missing).
   * @param userId Current user id.
   * @returns Progress summary including level list and completion counts.
   */
  async getUserProgress(userId: string) {
    const [levels, progressRaw] = await Promise.all([
      this.storyLevelRepository.listAll(),
      this.userStoryProgressRepository.listByUserId(userId),
    ]);

    let progress = progressRaw;
    if (levels.length > 0) {
      const first = levels[0];
      const hasFirst = progress.some((item) => item.level_id === first.id);
      if (!hasFirst) {
        await this.userStoryProgressRepository.ensureUnlocked(userId, first.id);
        progress = await this.userStoryProgressRepository.listByUserId(userId);
      }
    }

    const progressByLevelId = new Map(progress.map((item) => [item.level_id, item]));
    const completed_levels = progress.filter((item) => item.is_completed).length;

    return {
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

  /**
   * Ensure a user is allowed to play a level (unlocks level 1 when missing) and record an attempt.
   * @param userId Current user id.
   * @param level Level definition.
   * @returns The user's progress row for this level.
   */
  async assertLevelUnlocked(userId: string, level: StoryLevelLike): Promise<StoryProgressLike | null> {
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
