import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { QuizResolver } from './quiz.resolver';
import { QuizService } from './quiz.service';

@Module({
  imports: [DatabaseModule],
  providers: [QuizResolver, QuizService],
})
export class QuizModule {}
