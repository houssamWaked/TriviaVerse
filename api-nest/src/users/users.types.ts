import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AuthUser } from '../auth/auth.types';

@ObjectType()
export class UserStats {
  @Field(() => Int)
  level!: number;

  @Field(() => Int)
  xp_total!: number;

  @Field(() => Int)
  streak_days!: number;
}

@ObjectType()
export class ModeSummaryEntry {
  @Field()
  mode!: string;

  @Field(() => Int)
  played!: number;

  @Field(() => Int)
  completed!: number;

  @Field(() => Int)
  best_score!: number;

  @Field(() => String, { nullable: true })
  last_played_at?: string | null;
}

@ObjectType()
export class ModeSummary {
  @Field(() => [ModeSummaryEntry])
  entries!: ModeSummaryEntry[];
}

@ObjectType()
export class StoryProgress {
  @Field(() => Int)
  completed_levels!: number;

  @Field(() => Int)
  total_levels!: number;
}

@ObjectType()
export class CustomQuizBest {
  @Field()
  quiz_id!: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => Int)
  best_score!: number;

  @Field(() => String, { nullable: true })
  updated_at?: string | null;
}

@ObjectType()
export class MyProfilePayload {
  @Field(() => AuthUser)
  user!: AuthUser;

  @Field(() => UserStats)
  user_stats!: UserStats;

  @Field(() => ModeSummary)
  mode_summary!: ModeSummary;

  @Field(() => StoryProgress, { nullable: true })
  story_progress?: StoryProgress | null;

  @Field(() => [CustomQuizBest])
  custom_quiz_best!: CustomQuizBest[];
}
