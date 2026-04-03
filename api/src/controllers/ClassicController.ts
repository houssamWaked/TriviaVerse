/**
 * Classic mode controller.
 */
import type { Request, Response } from 'express';

type SessionStartServiceLike = {
  startClassicSession(userId: string | null, body: unknown): Promise<unknown>;
};

type ClassicLevel = {
  id: string;
  category_id: string;
  level_number: number;
  title: string;
  difficulty_min: number;
  difficulty_max: number;
  xp_reward: number;
};

type ClassicCategoryServiceLike = {
  listLevels(categoryId: string): Promise<ClassicLevel[]>;
  getUserProgress(userId: string, categoryId: string): Promise<unknown>;
};

type ClassicCategoryLevelPoolRepositoryLike = {
  countByLevelId?(levelId: string): Promise<number | null>;
} | null;

export class ClassicController {
  sessionStartService: SessionStartServiceLike;
  classicCategoryService: ClassicCategoryServiceLike;
  classicCategoryLevelPoolRepository: ClassicCategoryLevelPoolRepositoryLike;

  constructor(
    sessionStartService: SessionStartServiceLike,
    classicCategoryService: ClassicCategoryServiceLike,
    classicCategoryLevelPoolRepository: ClassicCategoryLevelPoolRepositoryLike = null
  ) {
    this.sessionStartService = sessionStartService;
    this.classicCategoryService = classicCategoryService;
    this.classicCategoryLevelPoolRepository = classicCategoryLevelPoolRepository;
  }

  start = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startClassicSession(req.user?.id || null, req.body);
    res.status(201).json(data);
  };

  listLevels = async (req: Request, res: Response) => {
    const categoryId = String(req.params.category_id || '').trim();
    const levels = await this.classicCategoryService.listLevels(categoryId);

    let countsByLevelId = new Map<string, number | null>();
    if (this.classicCategoryLevelPoolRepository?.countByLevelId) {
      const entries = await Promise.all(
        levels.map(async (level) => {
          try {
            const count = await this.classicCategoryLevelPoolRepository!.countByLevelId!(level.id);
            return [level.id, count] as const;
          } catch (error: any) {
            if (error?.code !== 'NOT_CONFIGURED') throw error;
            return [level.id, null] as const;
          }
        })
      );
      countsByLevelId = new Map(entries);
    }

    res.status(200).json({
      category_id: categoryId,
      levels: levels.map((level) => ({
        id: level.id,
        category_id: level.category_id,
        level_number: level.level_number,
        title: level.title,
        difficulty_min: level.difficulty_min,
        difficulty_max: level.difficulty_max,
        xp_reward: level.xp_reward,
        pool_count: countsByLevelId.get(level.id) ?? null,
      })),
    });
  };

  progress = async (req: Request, res: Response) => {
    const categoryId = String(req.params.category_id || '').trim();
    const data = await this.classicCategoryService.getUserProgress(req.user!.id, categoryId);
    res.status(200).json(data);
  };
}
