/**
 * Category business logic.
 */
import CategoryDTO from '../domain/dto/CategoryDTO.js';

type ErrorWithCode = { code?: string };

type CategoryEntityLike = {
  id?: string | null;
  name: string;
  icon?: string | null;
  created_at?: string | null;
};

type CategoryRepositoryLike = {
  findAll(): Promise<CategoryEntityLike[]>;
  findById(categoryId: string): Promise<CategoryEntityLike | null>;
};

type QuizQuestionRepositoryLike = {
  countAll(): Promise<number>;
} | null;

type ClassicCategoryPoolRepositoryLike = {
  countByCategoryId(categoryId: string): Promise<number>;
} | null;

type ClassicCategoryLevelRowLike = {
  id?: string | null;
};

type ClassicCategoryLevelRepositoryLike = {
  listByCategoryId(categoryId: string): Promise<ClassicCategoryLevelRowLike[]>;
} | null;

type ClassicCategoryLevelPoolRepositoryLike = {
  countByLevelIds(levelIds: string[]): Promise<number>;
} | null;

type CategoryStats = {
  category_id: string;
  questions_available: number;
};

// Domain service that exposes category lists and category-specific question availability.
export class CategoryService {
  categoryRepository: CategoryRepositoryLike;
  quizQuestionRepository: QuizQuestionRepositoryLike;
  classicCategoryPoolRepository: ClassicCategoryPoolRepositoryLike;
  classicCategoryLevelRepository: ClassicCategoryLevelRepositoryLike;
  classicCategoryLevelPoolRepository: ClassicCategoryLevelPoolRepositoryLike;

  /**
   * Construct the category service.
   * @param categoryRepository Category persistence.
   * @param quizQuestionRepository Fallback repository for global question counts.
   * @param classicCategoryPoolRepository Classic mode pool (category -> questions).
   * @param classicCategoryLevelRepository Classic mode level metadata.
   * @param classicCategoryLevelPoolRepository Classic mode pool (level -> questions).
   * @returns A `CategoryService` instance.
   */
  constructor(
    categoryRepository: CategoryRepositoryLike,
    quizQuestionRepository: QuizQuestionRepositoryLike = null,
    classicCategoryPoolRepository: ClassicCategoryPoolRepositoryLike = null,
    classicCategoryLevelRepository: ClassicCategoryLevelRepositoryLike = null,
    classicCategoryLevelPoolRepository: ClassicCategoryLevelPoolRepositoryLike = null
  ) {
    this.categoryRepository = categoryRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.classicCategoryPoolRepository = classicCategoryPoolRepository;
    this.classicCategoryLevelRepository = classicCategoryLevelRepository;
    this.classicCategoryLevelPoolRepository = classicCategoryLevelPoolRepository;
  }

  /**
   * List all categories.
   * @returns Array of category DTOs.
   */
  async listCategories(): Promise<CategoryDTO[]> {
    return (await this.categoryRepository.findAll()).map((entity) => CategoryDTO.fromEntity(entity));
  }

  /**
   * Compute available question count for a category (prefers classic-level pools when configured).
   * @param categoryId Category id.
   * @returns Category stats or `null` if the category does not exist.
   */
  async getCategoryStats(categoryId: string): Promise<CategoryStats | null> {
    const exists = await this.categoryRepository.findById(categoryId);
    if (!exists) return null;

    if (this.classicCategoryLevelRepository && this.classicCategoryLevelPoolRepository) {
      try {
        const levels = await this.classicCategoryLevelRepository.listByCategoryId(categoryId);
        if (Array.isArray(levels) && levels.length > 0) {
          const levelIds = levels.map((level) => level?.id).filter((id): id is string => Boolean(id));
          const count = await this.classicCategoryLevelPoolRepository.countByLevelIds(levelIds);
          return { category_id: categoryId, questions_available: count };
        }
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    if (this.classicCategoryPoolRepository) {
      try {
        const count = await this.classicCategoryPoolRepository.countByCategoryId(categoryId);
        return { category_id: categoryId, questions_available: count };
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    const total = this.quizQuestionRepository ? await this.quizQuestionRepository.countAll() : 0;
    return { category_id: categoryId, questions_available: total };
  }
}
