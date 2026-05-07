import { Context, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { MyProfilePayload } from './users.types';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => MyProfilePayload)
  myProfile(@Context() context: any) {
    return this.usersService.getMyProfile(context.req);
  }
}
