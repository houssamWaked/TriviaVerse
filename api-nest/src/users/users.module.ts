import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [UsersResolver, UsersService],
})
export class UsersModule {}
