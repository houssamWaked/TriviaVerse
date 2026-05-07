import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { CategoryModule } from './category/category.module';
import { HealthModule } from './health/health.module';
import { PublicModule } from './public/public.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      path: '/graphql',
    }),
    CategoryModule,
    HealthModule,
    PublicModule,
    QuizModule,
  ],
})
export class AppModule {}
