import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String)
  health() {
    return 'TriviaVerse GraphQL is running';
  }
}
