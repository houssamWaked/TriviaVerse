import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { QuizService } from './quiz.service';
import {
  QuizDetailsPayload,
  QuizLeaderboardPayload,
  QuizRatingsPayload,
  QuizSearchPayload,
  TopQuizzesPayload,
} from './quiz.types';

@Resolver()
export class QuizResolver {
  constructor(private readonly quizService: QuizService) {}

  @Query(() => QuizSearchPayload)
  searchQuizzes(
    @Args('q', { type: () => String }) q: string,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
  ) {
    return this.quizService.searchQuizzes(q, limit);
  }

  @Query(() => TopQuizzesPayload)
  topQuizzes(@Args('limit', { type: () => Int, nullable: true }) limit = 20) {
    return this.quizService.getTopQuizzes(limit);
  }

  @Query(() => QuizDetailsPayload)
  publicQuiz(@Args('quizId', { type: () => String }) quizId: string) {
    return this.quizService.getPublicQuiz(quizId);
  }

  @Query(() => QuizRatingsPayload)
  publicQuizRatings(@Args('quizId', { type: () => String }) quizId: string) {
    return this.quizService.getRatingsSummary(quizId);
  }

  @Query(() => QuizLeaderboardPayload)
  publicQuizLeaderboard(
    @Args('quizId', { type: () => String }) quizId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit = 20,
  ) {
    return this.quizService.getQuizLeaderboard(quizId, limit);
  }
}
