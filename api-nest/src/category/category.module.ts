import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';

@Module({
  imports: [DatabaseModule],
  providers: [CategoryResolver, CategoryService],
})
export class CategoryModule {}
