/**
 * Category controller (HTTP -> service layer).
 *
 * Controllers should:
 * - Read validated request inputs (`req.params`, `req.query`, `req.body`)
 * - Call the service layer
 * - Translate service results into HTTP status codes
 * - Throw `AppError` for expected failures (404, validation, etc.)
 *
 * Error handling:
 * - Route handlers are wrapped by `asyncHandler`, so thrown errors are passed
 *   to the global `errorHandler`.
 */
import AppError from '../utils/AppError.js';

export class CategoryController {
  constructor(categoryService) {
    this.categoryService = categoryService;
  }

  list = async (req, res) => {
    const data = await this.categoryService.listCategories();
    res.json(data);
  };

  stats = async (req, res) => {
    const data = await this.categoryService.getCategoryStats(req.params.id);
    if (!data) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.status(200).json(data);
  };
}
