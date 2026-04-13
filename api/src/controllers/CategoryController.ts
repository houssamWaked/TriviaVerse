/**
 * Category controller (HTTP -> service layer).
 */
import type { Request, Response } from 'express';
import AppError from '../utils/AppError.js';

type CategoryServiceLike = {
  listCategories(): Promise<unknown>;
  getCategoryStats(id: string): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

// HTTP adapter for category endpoints (list + per-category stats).
export class CategoryController {
  categoryService: CategoryServiceLike;

  /**
   * Construct a controller that delegates to the category service.
   * @param categoryService Domain service for categories.
   * @returns A `CategoryController` instance.
   */
  constructor(categoryService: CategoryServiceLike) {
    this.categoryService = categoryService;
  }

  /**
   * List all categories.
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A JSON array of categories.
   */
  list = async (_req: Request, res: Response) => {
    const data = await this.categoryService.listCategories();
    res.json(data);
  };

  /**
   * Fetch category stats (e.g., available questions).
   * @param req Express request (expects `:id` route param).
   * @param res Express response.
   * @returns A 200 response with stats; throws 404 if category is missing.
   */
  stats = async (req: Request, res: Response) => {
    const data = await this.categoryService.getCategoryStats(getParam(req.params.id));
    if (!data) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.status(200).json(data);
  };
}
