import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { HealthModule } from './health/health.module';
import { PublicModule } from './public/public.module';
import { QuizModule } from './quiz/quiz.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      path: '/graphql',
      context: ({ req }) => ({ req }),
    }),
    AuthModule,
    CategoryModule,
    HealthModule,
    PublicModule,
    QuizModule,
    UsersModule,
  ],
})
export class AppModule {}
