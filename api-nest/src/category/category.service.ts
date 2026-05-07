import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CategoryService {
  constructor(private readonly db: DatabaseService) {}

  async listCategories() {
    const { data, error } = await this.db.supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .order('created_at', { ascending: false });

    if (error) this.throwDbError(error.message);
    return data || [];
  }

  async getCategoryStats(categoryId: string) {
    const { data: category, error: categoryError } = await this.db.supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .limit(1);

    if (categoryError) this.throwDbError(categoryError.message);
    if (!category?.[0]) throw new NotFoundException('Category not found');

    const { count, error } = await this.db.supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });

    if (error) this.throwDbError(error.message);
    return { category_id: categoryId, questions_available: count || 0 };
  }

  private throwDbError(message: string): never {
    throw new InternalServerErrorException(message || 'Database error');
  }
}
