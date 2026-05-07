import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HomeMetrics {
  @Field(() => Int)
  active_players!: number;

  @Field(() => Int)
  questions!: number;

  @Field(() => Int)
  quizzes_created!: number;

  @Field(() => Int)
  fun_level!: number;
}

@ObjectType()
export class LeaderboardEntry {
  @Field(() => Int, { nullable: true })
  rank_position?: number | null;

  @Field()
  user_id!: string;

  @Field(() => String, { nullable: true })
  username?: string | null;

  @Field(() => String, { nullable: true })
  avatar_url?: string | null;

  @Field(() => Int, { nullable: true })
  level?: number | null;

  @Field(() => Int)
  score_value!: number;
}

@ObjectType()
export class LeaderboardPayload {
  @Field()
  period!: string;

  @Field()
  mode!: string;

  @Field()
  period_resolved!: string;

  @Field(() => [LeaderboardEntry])
  entries!: LeaderboardEntry[];
}
