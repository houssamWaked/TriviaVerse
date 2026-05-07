import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PublicResolver } from './public.resolver';
import { PublicService } from './public.service';

@Module({
  imports: [DatabaseModule],
  providers: [PublicResolver, PublicService],
})
export class PublicModule {}
