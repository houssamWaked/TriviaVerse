/**
 * Quiz builder routes.
 *
 * Mounted at:
 * - `/api/quizzes`
 * - `/api/questions`
 * - `/api/options`
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import {
  addOptionValidator,
  addQuestionValidator,
  createQuizValidator,
  optionIdParam,
  patchOptionValidator,
  patchQuestionValidator,
  patchQuizValidator,
  questionIdParam,
  quizIdParam,
  reportQuizBody,
} from '../validator/QuizValidator.js';
import { accessBody, accessUserIdParam, ratingBody } from '../validator/QuizDiscoveryValidator.js';

type QuizBuilderControllerLike = {
  listQuizzes: Parameters<typeof asyncHandler>[0];
  listPlayedQuizzes: Parameters<typeof asyncHandler>[0];
  createQuiz: Parameters<typeof asyncHandler>[0];
  startCustomSession: Parameters<typeof asyncHandler>[0];
  rateQuiz: Parameters<typeof asyncHandler>[0];
  listQuizAccess: Parameters<typeof asyncHandler>[0];
  addQuizAccess: Parameters<typeof asyncHandler>[0];
  removeQuizAccess: Parameters<typeof asyncHandler>[0];
  deleteQuiz: Parameters<typeof asyncHandler>[0];
  getQuiz: Parameters<typeof asyncHandler>[0];
  patchQuiz: Parameters<typeof asyncHandler>[0];
  publishQuiz: Parameters<typeof asyncHandler>[0];
  reportQuiz: Parameters<typeof asyncHandler>[0];
  listQuizQuestions: Parameters<typeof asyncHandler>[0];
  addQuizQuestion: Parameters<typeof asyncHandler>[0];
  patchQuizQuestion: Parameters<typeof asyncHandler>[0];
  addQuestionOption: Parameters<typeof asyncHandler>[0];
  patchQuestionOption: Parameters<typeof asyncHandler>[0];
};

export default function createQuizBuilderRouter(quizBuilderController: QuizBuilderControllerLike) {
  const router = Router();
  router.get('/', requireAuth, asyncHandler(quizBuilderController.listQuizzes));
  router.get('/played', requireAuth, asyncHandler(quizBuilderController.listPlayedQuizzes));
  router.post('/', requireAuth, createQuizValidator, validateRequest, asyncHandler(quizBuilderController.createQuiz));
  router.post(
    '/:quiz_id/sessions/start',
    optionalAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.startCustomSession)
  );
  router.post(
    '/:quiz_id/ratings',
    requireAuth,
    quizIdParam,
    ratingBody,
    validateRequest,
    asyncHandler(quizBuilderController.rateQuiz)
  );
  router.get(
    '/:quiz_id/access',
    requireAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.listQuizAccess)
  );
  router.post(
    '/:quiz_id/access',
    requireAuth,
    quizIdParam,
    accessBody,
    validateRequest,
    asyncHandler(quizBuilderController.addQuizAccess)
  );
  router.delete(
    '/:quiz_id/access/:user_id',
    requireAuth,
    quizIdParam,
    accessUserIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.removeQuizAccess)
  );
  router.delete(
    '/:quiz_id',
    requireAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.deleteQuiz)
  );
  router.get(
    '/:quiz_id',
    requireAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.getQuiz)
  );
  router.patch(
    '/:quiz_id',
    requireAuth,
    quizIdParam,
    patchQuizValidator,
    validateRequest,
    asyncHandler(quizBuilderController.patchQuiz)
  );
  router.post(
    '/:quiz_id/publish',
    requireAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.publishQuiz)
  );
  router.post(
    '/:quiz_id/report',
    requireAuth,
    quizIdParam,
    reportQuizBody,
    validateRequest,
    asyncHandler(quizBuilderController.reportQuiz)
  );
  router.get(
    '/:quiz_id/questions',
    requireAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.listQuizQuestions)
  );
  router.post(
    '/:quiz_id/questions',
    requireAuth,
    quizIdParam,
    addQuestionValidator,
    validateRequest,
    asyncHandler(quizBuilderController.addQuizQuestion)
  );
  return router;
}

export function createQuestionsRouter(quizBuilderController: QuizBuilderControllerLike) {
  const router = Router();
  router.patch(
    '/:question_id',
    requireAuth,
    questionIdParam,
    patchQuestionValidator,
    validateRequest,
    asyncHandler(quizBuilderController.patchQuizQuestion)
  );
  router.post(
    '/:question_id/options',
    requireAuth,
    questionIdParam,
    addOptionValidator,
    validateRequest,
    asyncHandler(quizBuilderController.addQuestionOption)
  );
  return router;
}

export function createOptionsRouter(quizBuilderController: QuizBuilderControllerLike) {
  const router = Router();
  router.patch(
    '/:option_id',
    requireAuth,
    optionIdParam,
    patchOptionValidator,
    validateRequest,
    asyncHandler(quizBuilderController.patchQuestionOption)
  );
  return router;
}
