import { Args, Query, Resolver } from '@nestjs/graphql';
import { PublicService } from './public.service';
import { HomeMetrics, LeaderboardPayload } from './public.types';

@Resolver()
export class PublicResolver {
  constructor(private readonly publicService: PublicService) {}

  @Query(() => HomeMetrics)
  homeMetrics() {
    return this.publicService.getHomeMetrics();
  }

  @Query(() => LeaderboardPayload)
  leaderboard(
    @Args('period', { type: () => String, nullable: true }) period = 'all_time',
    @Args('mode', { type: () => String, nullable: true }) mode = 'global',
  ) {
    return this.publicService.getLeaderboard(period, mode);
  }
}
