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

export default function createQuizBuilderRouter(quizBuilderController) {
  const router = Router();

  router.get('/', requireAuth, asyncHandler(quizBuilderController.listQuizzes));
  router.get('/played', requireAuth, asyncHandler(quizBuilderController.listPlayedQuizzes));

  // quizzes
  router.post(
    '/',
    requireAuth,
    createQuizValidator,
    validateRequest,
    asyncHandler(quizBuilderController.createQuiz)
  );

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

  // quiz questions
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

export function createQuestionsRouter(quizBuilderController) {
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

export function createOptionsRouter(quizBuilderController) {
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
