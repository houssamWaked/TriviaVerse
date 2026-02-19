/**
 * Classic mode controller.
 */
export class ClassicController {
  constructor(
    sessionStartService,
    classicCategoryService,
    classicCategoryLevelPoolRepository = null
  ) {
    this.sessionStartService = sessionStartService;
    this.classicCategoryService = classicCategoryService;
    this.classicCategoryLevelPoolRepository = classicCategoryLevelPoolRepository;
  }

  start = async (req, res) => {
    const data = await this.sessionStartService.startClassicSession(req.user?.id || null, req.body);
    res.status(201).json(data);
  };

  listLevels = async (req, res) => {
    const categoryId = String(req.params.category_id || '').trim();
    const levels = await this.classicCategoryService.listLevels(categoryId);

    let countsByLevelId = new Map();
    if (this.classicCategoryLevelPoolRepository?.countByLevelId) {
      const entries = await Promise.all(
        levels.map(async (lvl) => {
          try {
            const c = await this.classicCategoryLevelPoolRepository.countByLevelId(lvl.id);
            return [lvl.id, c];
          } catch (err) {
            if (err?.code !== 'NOT_CONFIGURED') throw err;
            return [lvl.id, null];
          }
        })
      );
      countsByLevelId = new Map(entries);
    }

    res.status(200).json({
      category_id: categoryId,
      levels: levels.map((lvl) => ({
        id: lvl.id,
        category_id: lvl.category_id,
        level_number: lvl.level_number,
        title: lvl.title,
        difficulty_min: lvl.difficulty_min,
        difficulty_max: lvl.difficulty_max,
        xp_reward: lvl.xp_reward,
        pool_count: countsByLevelId.get(lvl.id) ?? null,
      })),
    });
  };

  progress = async (req, res) => {
    const categoryId = String(req.params.category_id || '').trim();
    const data = await this.classicCategoryService.getUserProgress(req.user.id, categoryId);
    res.status(200).json(data);
  };
}
