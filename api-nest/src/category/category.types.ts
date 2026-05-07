import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicCategory {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  icon?: string | null;

  @Field(() => String, { nullable: true })
  created_at?: string | null;
}

@ObjectType()
export class CategoryStatsPayload {
  @Field()
  category_id!: string;

  @Field(() => Int)
  questions_available!: number;
}
