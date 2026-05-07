import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field()
  id!: string;

  @Field()
  username!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  avatar_url?: string | null;
}

@ObjectType()
export class AuthPayload {
  @Field(() => AuthUser)
  user!: AuthUser;

  @Field()
  token!: string;
}
