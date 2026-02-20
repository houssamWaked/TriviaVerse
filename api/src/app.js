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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requireAuth } from './middlewares/requireAuth.js';
import { createProtectApi } from './middlewares/protectApi.js';
import AppError from './utils/AppError.js';

import createAuthRouter from './routes/AuthRoute.js';
import createPublicRouter from './routes/PublicRoute.js';
import createLeaderboardRouter from './routes/LeaderboardRoute.js';
import createPublicCategoryRouter from './routes/PublicCategoryRoute.js';
import createQuizBuilderRouter, {
  createOptionsRouter,
  createQuestionsRouter,
} from './routes/QuizBuilderRoute.js';
import createStoryRouter from './routes/StoryRoute.js';
import createStoryPublicRouter from './routes/StoryPublicRoute.js';
import createMillionaireRouter from './routes/MillionaireRoute.js';
import createClassicRouter from './routes/ClassicRoute.js';
import createClassicProtectedRouter from './routes/ClassicProtectedRoute.js';
import createBlitzRouter from './routes/BlitzRoute.js';
import createSessionsRouter from './routes/SessionsRoute.js';
import createFriendsRouter from './routes/FriendsRoute.js';
import createAdminRouter from './routes/AdminRoute.js';
import createMeRouter from './routes/MeRoute.js';
import createDuelsRouter from './routes/DuelsRoute.js';
import createMatchmakingRouter from './routes/MatchmakingRoute.js';

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
import { DuelController } from './controllers/DuelController.js';
import { MatchmakingController } from './controllers/MatchmakingController.js';

import { CategoryService } from './services/CategoryService.js';
import { AuthService } from './services/AuthService.js';
import { PublicService } from './services/PublicService.js';
import { LeaderboardService } from './services/LeaderboardService.js';
import { QuizBuilderService } from './services/QuizBuilderService.js';
import { StoryService } from './services/StoryService.js';
import { ClassicCategoryService } from './services/ClassicCategoryService.js';
import { SessionStartService } from './services/SessionStartService.js';
import { SessionService } from './services/SessionService.js';
import { QuizDiscoveryService } from './services/QuizDiscoveryService.js';
import { FriendService } from './services/FriendService.js';
import { AdminService } from './services/AdminService.js';
import { MeService } from './services/MeService.js';
import { DuelService } from './services/DuelService.js';
import { QuizReportService } from './services/QuizReportService.js';
import { BlitzMatchmakingService } from './services/BlitzMatchmakingService.js';

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
import { ClassicCategoryLevelRepository } from './domain/repositories/ClassicCategoryLevelRepository.js';
import { ClassicCategoryLevelPoolRepository } from './domain/repositories/ClassicCategoryLevelPoolRepository.js';
import { ClassicSessionRepository } from './domain/repositories/ClassicSessionRepository.js';
import { UserClassicProgressRepository } from './domain/repositories/UserClassicProgressRepository.js';
import { DuelRepository } from './domain/repositories/DuelRepository.js';
import { DuelAnswerRepository } from './domain/repositories/DuelAnswerRepository.js';
import { DuelClaimRepository } from './domain/repositories/DuelClaimRepository.js';
import { QuizReportRepository } from './domain/repositories/QuizReportRepository.js';
import { BlitzMatchmakingQueueRepository } from './domain/repositories/BlitzMatchmakingQueueRepository.js';

const app = express();

app.disable('x-powered-by');

// Trust proxy headers on common PaaS deployments (Railway, Heroku, etc.) so
// rate limiting and req.ip work as expected.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

app.use(
  helmet({
    // This API serves JSON, not HTML documents.
    contentSecurityPolicy: false,
  })
);

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .map((s) => s.replace(/^['"]|['"]$/g, ''))
  .map((s) => (s.endsWith('/') ? s.replace(/\/+$/, '') : s))
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  // Fail fast in prod rather than silently allowing any website to call your API.
  throw new AppError('Missing CORS_ORIGINS in production', 500, 'CONFIG_ERROR');
}

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (no Origin) and same-origin requests.
      if (!origin) return cb(null, true);
      const normalizedOrigin = String(origin).trim().replace(/\/+$/, '');
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);
      return cb(new AppError('CORS origin not allowed', 403, 'CORS_FORBIDDEN'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));

app.get('/health', (req, res) => res.status(200).json({ ok: true }));

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
const classicCategoryLevelRepository = new ClassicCategoryLevelRepository();
const classicCategoryLevelPoolRepository = new ClassicCategoryLevelPoolRepository();
const classicSessionRepository = new ClassicSessionRepository();
const userClassicProgressRepository = new UserClassicProgressRepository();
const duelRepository = new DuelRepository();
const duelAnswerRepository = new DuelAnswerRepository();
const duelClaimRepository = new DuelClaimRepository();
const quizReportRepository = new QuizReportRepository();
const blitzMatchmakingQueueRepository = new BlitzMatchmakingQueueRepository();

// services
const categoryService = new CategoryService(
  categoryRepository,
  quizQuestionRepository,
  classicCategoryPoolRepository,
  classicCategoryLevelRepository,
  classicCategoryLevelPoolRepository
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
const quizReportService = new QuizReportService({
  quizRepository,
  quizReportRepository,
});
const storyService = new StoryService(storyLevelRepository, userStoryProgressRepository);
const classicCategoryService = new ClassicCategoryService(
  classicCategoryLevelRepository,
  userClassicProgressRepository
);
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
  classicCategoryLevelRepository,
  classicCategoryLevelPoolRepository,
  classicSessionRepository,
  classicCategoryService,
});
const sessionService = new SessionService({
  gameSessionRepository,
  sessionQuestionRepository,
  sessionOptionRepository,
  sessionAnswerRepository,
  sessionLifelineRepository,
  leaderboardRepository,
  userStatsRepository,
  quizQuestionRepository,
  quizScoreRepository,
  quizRatingRepository,
  storyLevelRepository,
  userStoryProgressRepository,
  storySessionRepository,
  classicCategoryLevelRepository,
  userClassicProgressRepository,
  classicSessionRepository,
  sessionStartService,
});
const friendService = new FriendService({
  friendRepository,
  userRepository,
  userStatsRepository,
  quizScoreRepository,
  quizRepository,
  gameSessionRepository,
  storyService,
});

const adminService = new AdminService({
  storyLevelRepository,
  storyLevelPoolRepository,
  quizQuestionRepository,
  questionOptionRepository,
  modeQuestionPoolRepository,
  categoryRepository,
  classicCategoryPoolRepository,
  classicCategoryLevelRepository,
  classicCategoryLevelPoolRepository,
  classicSessionRepository,
  userClassicProgressRepository,
  sessionQuestionRepository,
  userStoryProgressRepository,
  storySessionRepository,
  quizRepository,
  quizAccessRepository,
  quizRatingRepository,
  quizScoreRepository,
  gameSessionRepository,
  quizReportRepository,
  userRepository,
});

// controllers
const categoryController = new CategoryController(categoryService);
const authController = new AuthController(authService);
const publicController = new PublicController(publicService);
const leaderboardController = new LeaderboardController(leaderboardService);
const quizBuilderController = new QuizBuilderController(
  quizBuilderService,
  sessionStartService,
  quizReportService
);
const storyController = new StoryController(storyService, sessionStartService);
const millionaireController = new MillionaireController(
  millionaireLadderRepository,
  sessionStartService
);
const classicController = new ClassicController(
  sessionStartService,
  classicCategoryService,
  classicCategoryLevelPoolRepository
);
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
const duelController = new DuelController(
  new DuelService({
    duelRepository,
    duelAnswerRepository,
    duelClaimRepository,
    friendRepository,
    userRepository,
    quizRepository,
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    sessionAnswerRepository,
    sessionStartService,
  })
);
const matchmakingController = new MatchmakingController(
  new BlitzMatchmakingService({
    queueRepository: blitzMatchmakingQueueRepository,
    duelRepository,
    sessionStartService,
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

const authWindowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60_000);
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX || 20);

const apiWindowMs = Number(process.env.RATE_LIMIT_API_WINDOW_MS || 15 * 60_000);
const apiMax = Number(process.env.RATE_LIMIT_API_MAX || 600);
app.use(
  '/api',
  rateLimit({
    windowMs: apiWindowMs,
    limit: apiMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res, next) {
      next(new AppError('Too many requests', 429, 'RATE_LIMITED'));
    },
  })
);

app.use(
  '/api/auth',
  rateLimit({
    windowMs: authWindowMs,
    limit: authMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res, next) {
      next(new AppError('Too many auth requests', 429, 'RATE_LIMITED'));
    },
  }),
  createAuthRouter(authController)
);

// Protect everything under `/api/*` except `/api/public/*`, `/api/auth/*`, and leaderboard routes.
app.use('/api', createProtectApi({ requireAuth }));

// Public routes
app.use('/api/public', createPublicRouter(publicController, quizDiscoveryController));
app.use('/api/public/categories', createPublicCategoryRouter(categoryController));
app.use('/api/public/leaderboard', createLeaderboardRouter(leaderboardController));
app.use('/api/public/story', createStoryPublicRouter(storyController));
app.use('/api/public/millionaire', createMillionaireRouter(millionaireController));
app.use('/api/public/classic', createClassicRouter(classicController));
app.use('/api/public/blitz', createBlitzRouter(blitzController));
app.use('/api/public/sessions', createSessionsRouter(sessionsController));

app.use('/api/quizzes', createQuizBuilderRouter(quizBuilderController));
app.use('/api/questions', createQuestionsRouter(quizBuilderController));
app.use('/api/options', createOptionsRouter(quizBuilderController));

app.use('/api/story', createStoryRouter(storyController));
app.use('/api/classic', createClassicProtectedRouter(classicController));
app.use('/api/friends', createFriendsRouter(friendController));
app.use('/api/admin', createAdminRouter(adminController));
app.use('/api/me', createMeRouter(meController));
app.use('/api/matchmaking', createMatchmakingRouter(matchmakingController));
app.use('/api/duels', createDuelsRouter(duelController));

// 404 then error handler (order matters)
app.use(notFound);
app.use(errorHandler);

export default app;
