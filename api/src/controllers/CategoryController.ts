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

export class CategoryController {
  categoryService: CategoryServiceLike;

  constructor(categoryService: CategoryServiceLike) {
    this.categoryService = categoryService;
  }

  list = async (_req: Request, res: Response) => {
    const data = await this.categoryService.listCategories();
    res.json(data);
  };

  stats = async (req: Request, res: Response) => {
    const data = await this.categoryService.getCategoryStats(getParam(req.params.id));
    if (!data) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    res.status(200).json(data);
  };
}
