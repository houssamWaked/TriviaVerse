import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuthResolver, AuthService, AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthModule {}
