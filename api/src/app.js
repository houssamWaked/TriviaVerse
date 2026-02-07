/**
 * Express application composition root.
 *
 * This file wires the HTTP layer (Express) to the domain/services layer by:
 * - Creating repositories/services/controllers (simple DI)
 * - Mounting routers with controller instances
 * - Registering global middleware (404 + error handler)
 *
 * When adding new modules, follow the same pattern:
 * - Create Repo -> Service -> Controller
 * - Create Router(controller)
 * - Mount under `/api/<resource>`
 */
import express from 'express';
import cors from 'cors';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

import createCategoryRouter from './routes/CategoryRoute.js';
import createAuthRouter from './routes/AuthRoute.js';
import createPublicRouter from './routes/PublicRoute.js';
import createLeaderboardRouter from './routes/LeaderboardRoute.js';
import createQuizBuilderRouter, {
  createOptionsRouter,
  createQuestionsRouter,
} from './routes/QuizBuilderRoute.js';
import createStoryRouter from './routes/StoryRoute.js';
import createMillionaireRouter from './routes/MillionaireRoute.js';
import createClassicRouter from './routes/ClassicRoute.js';
import createBlitzRouter from './routes/BlitzRoute.js';
import createSessionsRouter from './routes/SessionsRoute.js';
import createFriendsRouter from './routes/FriendsRoute.js';
import createAdminRouter from './routes/AdminRoute.js';
import createMeRouter from './routes/MeRoute.js';

import { CategoryController } from './controllers/CategoryController.js';
import { AuthController } from './controllers/AuthController.js';
import { PublicController } from './controllers/PublicController.js';
import { LeaderboardController } from './controllers/LeaderboardController.js';
import { QuizBuilderController } from './controllers/QuizBuilderController.js';
import { StoryController } from './controllers/StoryController.js';
import { MillionaireController } from './controllers/MillionaireController.js';
import { ClassicController } from './controllers/ClassicController.js';
import { BlitzController } from './controllers/BlitzController.js';
import { SessionsController } from './controllers/SessionsController.js';
import { QuizDiscoveryController } from './controllers/QuizDiscoveryController.js';
import { FriendController } from './controllers/FriendController.js';
import { AdminController } from './controllers/AdminController.js';
import { MeController } from './controllers/MeController.js';

import { CategoryService } from './services/CategoryService.js';
import { AuthService } from './services/AuthService.js';
import { PublicService } from './services/PublicService.js';
import { LeaderboardService } from './services/LeaderboardService.js';
import { QuizBuilderService } from './services/QuizBuilderService.js';
import { StoryService } from './services/StoryService.js';
import { SessionStartService } from './services/SessionStartService.js';
import { SessionService } from './services/SessionService.js';
import { QuizDiscoveryService } from './services/QuizDiscoveryService.js';
import { FriendService } from './services/FriendService.js';
import { AdminService } from './services/AdminService.js';
import { MeService } from './services/MeService.js';

import { CategoryRepository } from './domain/repositories/CategoryRepository.js';
import { UserRepository } from './domain/repositories/UserRepository.js';
import { UserStatsRepository } from './domain/repositories/UserStatsRepository.js';
import { GameSessionRepository } from './domain/repositories/GameSessionRepository.js';
import { QuizRepository } from './domain/repositories/QuizRepository.js';
import { QuizQuestionRepository } from './domain/repositories/QuizQuestionRepository.js';
import { QuestionOptionRepository } from './domain/repositories/QuestionOptionRepository.js';
import { LeaderboardRepository } from './domain/repositories/LeaderboardRepository.js';
import { SessionQuestionRepository } from './domain/repositories/SessionQuestionRepository.js';
import { SessionOptionRepository } from './domain/repositories/SessionOptionRepository.js';
import { SessionAnswerRepository } from './domain/repositories/SessionAnswerRepository.js';
import { SessionLifelineRepository } from './domain/repositories/SessionLifelineRepository.js';
import { StoryLevelRepository } from './domain/repositories/StoryLevelRepository.js';
import { UserStoryProgressRepository } from './domain/repositories/UserStoryProgressRepository.js';
import { StoryLevelPoolRepository } from './domain/repositories/StoryLevelPoolRepository.js';
import { StorySessionRepository } from './domain/repositories/StorySessionRepository.js';
import { MillionaireLadderRepository } from './domain/repositories/MillionaireLadderRepository.js';
import { QuizAccessRepository } from './domain/repositories/QuizAccessRepository.js';
import { QuizRatingRepository } from './domain/repositories/QuizRatingRepository.js';
import { QuizScoreRepository } from './domain/repositories/QuizScoreRepository.js';
import { FriendRepository } from './domain/repositories/FriendRepository.js';
import { ModeQuestionPoolRepository } from './domain/repositories/ModeQuestionPoolRepository.js';
import { ClassicCategoryPoolRepository } from './domain/repositories/ClassicCategoryPoolRepository.js';

const app = express();

app.use(cors());
app.use(express.json());

// repositories
const categoryRepository = new CategoryRepository();
const userRepository = new UserRepository();
const userStatsRepository = new UserStatsRepository();
const quizRepository = new QuizRepository();
const quizQuestionRepository = new QuizQuestionRepository();
const questionOptionRepository = new QuestionOptionRepository();
const quizAccessRepository = new QuizAccessRepository();
const quizRatingRepository = new QuizRatingRepository();
const quizScoreRepository = new QuizScoreRepository();
const friendRepository = new FriendRepository();
const gameSessionRepository = new GameSessionRepository();
const leaderboardRepository = new LeaderboardRepository();
const sessionQuestionRepository = new SessionQuestionRepository();
const sessionOptionRepository = new SessionOptionRepository();
const sessionAnswerRepository = new SessionAnswerRepository();
const sessionLifelineRepository = new SessionLifelineRepository();
const storyLevelRepository = new StoryLevelRepository();
const userStoryProgressRepository = new UserStoryProgressRepository();
const storyLevelPoolRepository = new StoryLevelPoolRepository();
const storySessionRepository = new StorySessionRepository();
const millionaireLadderRepository = new MillionaireLadderRepository();
const modeQuestionPoolRepository = new ModeQuestionPoolRepository();
const classicCategoryPoolRepository = new ClassicCategoryPoolRepository();

// services
const categoryService = new CategoryService(
  categoryRepository,
  quizQuestionRepository,
  classicCategoryPoolRepository
);
const authService = new AuthService(userRepository, userStatsRepository);
const publicService = new PublicService(
  gameSessionRepository,
  quizQuestionRepository,
  quizRepository
);
const leaderboardService = new LeaderboardService(
  leaderboardRepository,
  userRepository,
  userStatsRepository
);
const quizBuilderService = new QuizBuilderService(
  quizRepository,
  quizQuestionRepository,
  questionOptionRepository,
  userRepository,
  quizAccessRepository,
  friendRepository,
  quizRatingRepository,
  quizScoreRepository,
  gameSessionRepository,
  storyLevelPoolRepository,
  sessionQuestionRepository
);
const storyService = new StoryService(storyLevelRepository, userStoryProgressRepository);
const sessionStartService = new SessionStartService({
  gameSessionRepository,
  sessionQuestionRepository,
  sessionOptionRepository,
  quizQuestionRepository,
  questionOptionRepository,
  quizRepository,
  quizAccessRepository,
  friendRepository,
  storySessionRepository,
  storyLevelRepository,
  storyLevelPoolRepository,
  storyService,
  millionaireLadderRepository,
  modeQuestionPoolRepository,
  classicCategoryPoolRepository,
});
const sessionService = new SessionService({
  gameSessionRepository,
  sessionQuestionRepository,
  sessionOptionRepository,
  sessionAnswerRepository,
  sessionLifelineRepository,
  leaderboardRepository,
  userStatsRepository,
  quizScoreRepository,
  storyLevelRepository,
  userStoryProgressRepository,
  storySessionRepository,
});
const friendService = new FriendService({
  friendRepository,
  userRepository,
  userStatsRepository,
  quizScoreRepository,
  quizRepository,
});

const adminService = new AdminService({
  storyLevelRepository,
  storyLevelPoolRepository,
  quizQuestionRepository,
  questionOptionRepository,
  modeQuestionPoolRepository,
  categoryRepository,
  classicCategoryPoolRepository,
});

// controllers
const categoryController = new CategoryController(categoryService);
const authController = new AuthController(authService);
const publicController = new PublicController(publicService);
const leaderboardController = new LeaderboardController(leaderboardService);
const quizBuilderController = new QuizBuilderController(quizBuilderService, sessionStartService);
const storyController = new StoryController(storyService, sessionStartService);
const millionaireController = new MillionaireController(
  millionaireLadderRepository,
  sessionStartService
);
const classicController = new ClassicController(sessionStartService);
const blitzController = new BlitzController(sessionStartService);
const sessionsController = new SessionsController(sessionService);
const friendController = new FriendController(friendService);
const adminController = new AdminController(adminService);
const meController = new MeController(
  new MeService({
    userRepository,
    userStatsRepository,
    gameSessionRepository,
    storyService,
    quizScoreRepository,
    quizRepository,
  })
);
const quizDiscoveryController = new QuizDiscoveryController(
  new QuizDiscoveryService({
    quizRepository,
    quizQuestionRepository,
    questionOptionRepository,
    userRepository,
    quizAccessRepository,
    friendRepository,
    quizRatingRepository,
    quizScoreRepository,
  })
);

app.use('/api/categories', createCategoryRouter(categoryController));
app.use('/api/public', createPublicRouter(publicController, quizDiscoveryController));
app.use('/api/auth', createAuthRouter(authController));
app.use('/api/leaderboard', createLeaderboardRouter(leaderboardController));

app.use('/api/quizzes', createQuizBuilderRouter(quizBuilderController));
app.use('/api/questions', createQuestionsRouter(quizBuilderController));
app.use('/api/options', createOptionsRouter(quizBuilderController));

app.use('/api/story', createStoryRouter(storyController));
app.use('/api/millionaire', createMillionaireRouter(millionaireController));
app.use('/api/classic', createClassicRouter(classicController));
app.use('/api/blitz', createBlitzRouter(blitzController));
app.use('/api/sessions', createSessionsRouter(sessionsController));
app.use('/api/friends', createFriendsRouter(friendController));
app.use('/api/admin', createAdminRouter(adminController));
app.use('/api/me', createMeRouter(meController));

// 404 then error handler (order matters)
app.use(notFound);
app.use(errorHandler);

export default app;
