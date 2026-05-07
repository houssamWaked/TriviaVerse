import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class QuizOwner {
  @Field()
  id!: string;

  @Field()
  username!: string;

  @Field(() => String, { nullable: true })
  avatar_url?: string | null;
}

@ObjectType()
export class QuizSummary {
  @Field()
  id!: string;

  @Field()
  owner_user_id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  cover_image_url?: string | null;

  @Field()
  visibility!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  created_at?: string | null;

  @Field(() => String, { nullable: true })
  published_at?: string | null;

  @Field(() => QuizOwner, { nullable: true })
  owner?: QuizOwner | null;

  @Field(() => Float)
  ratings_avg!: number;

  @Field(() => Int)
  ratings_count!: number;

  @Field(() => Int)
  played_count!: number;
}

@ObjectType()
export class QuizSearchPayload {
  @Field()
  q!: string;

  @Field(() => [QuizSummary])
  results!: QuizSummary[];
}

@ObjectType()
export class TopQuizzesPayload {
  @Field(() => [QuizSummary])
  results!: QuizSummary[];
}

@ObjectType()
export class QuizDetailsPayload {
  @Field(() => QuizSummary, { nullable: true })
  quiz?: QuizSummary | null;

  @Field(() => Int)
  questions_count!: number;

  @Field()
  can_edit!: boolean;
}

@ObjectType()
export class QuizRatingsPayload {
  @Field(() => Float)
  ratings_avg!: number;

  @Field(() => Int)
  ratings_count!: number;

  @Field(() => Int, { nullable: true })
  my_rating?: number | null;
}

@ObjectType()
export class QuizLeaderboardEntry {
  @Field(() => Int)
  rank_position!: number;

  @Field()
  user_id!: string;

  @Field(() => String, { nullable: true })
  username?: string | null;

  @Field(() => String, { nullable: true })
  avatar_url?: string | null;

  @Field(() => Int)
  best_score!: number;

  @Field(() => String, { nullable: true })
  updated_at?: string | null;
}

@ObjectType()
export class QuizLeaderboardPayload {
  @Field()
  quiz_id!: string;

  @Field(() => Int, { nullable: true })
  my_best_score?: number | null;

  @Field(() => [QuizLeaderboardEntry])
  entries!: QuizLeaderboardEntry[];

  @Field(() => Boolean, { nullable: true })
  not_configured?: boolean | null;
}
