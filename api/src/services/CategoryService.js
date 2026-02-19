/**
 * Category business logic.
 *
 * Services should:
 * - Contain business rules and orchestration
 * - Be independent of HTTP/Express
 * - Return domain entities or DTOs depending on your API conventions
 *
 * This service returns DTOs to ensure consistent response shapes at the edges.
 */
import CategoryDTO from '../domain/dto/CategoryDTO.js';

export class CategoryService {
  constructor(
    categoryRepository,
    quizQuestionRepository = null,
    classicCategoryPoolRepository = null,
    classicCategoryLevelRepository = null,
    classicCategoryLevelPoolRepository = null
  ) {
    this.categoryRepository = categoryRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.classicCategoryPoolRepository = classicCategoryPoolRepository;
    this.classicCategoryLevelRepository = classicCategoryLevelRepository;
    this.classicCategoryLevelPoolRepository = classicCategoryLevelPoolRepository;
  }

  /**
   * @returns {Promise<CategoryDTO[]>}
   */
  async listCategories() {
    return (await this.categoryRepository.findAll()).map(CategoryDTO.fromEntity);
  }

  /**
   * Category stats used by the Classic Quiz category selection screen.
   *
   * NOTE: The provided schema does not include a category foreign key on
   * `quiz_questions`, so this currently returns the total question count as a
   * fallback. Once questions are categorizable, filter by `category_id` here.
   */
  async getCategoryStats(categoryId) {
    const exists = await this.categoryRepository.findById(categoryId);
    if (!exists) return null;

    // Prefer classic levels: sum of questions across all levels in the category.
    // This is what players actually play when the classic-level schema is enabled.
    if (this.classicCategoryLevelRepository && this.classicCategoryLevelPoolRepository) {
      try {
        const levels = await this.classicCategoryLevelRepository.listByCategoryId(categoryId);
        if (Array.isArray(levels) && levels.length > 0) {
          const levelIds = levels.map((l) => l?.id).filter(Boolean);
          const count = await this.classicCategoryLevelPoolRepository.countByLevelIds(levelIds);
          return { category_id: categoryId, questions_available: count };
        }
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    // If classic category pools are configured, show the per-category count.
    if (this.classicCategoryPoolRepository) {
      try {
        const count = await this.classicCategoryPoolRepository.countByCategoryId(categoryId);
        return { category_id: categoryId, questions_available: count };
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    // Fallback: schema does not categorize questions.
    const total = this.quizQuestionRepository ? await this.quizQuestionRepository.countAll() : 0;
    return { category_id: categoryId, questions_available: total };
  }
}
