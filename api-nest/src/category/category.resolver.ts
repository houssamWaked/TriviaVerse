import { Args, Query, Resolver } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { CategoryStatsPayload, PublicCategory } from './category.types';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => [PublicCategory])
  publicCategories() {
    return this.categoryService.listCategories();
  }

  @Query(() => CategoryStatsPayload)
  categoryStats(@Args('id', { type: () => String }) id: string) {
    return this.categoryService.getCategoryStats(id);
  }
}
