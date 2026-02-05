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
  shareQuizValidator,
} from '../validator/QuizValidator.js';

export default function createQuizBuilderRouter(quizBuilderController) {
  const router = Router();

  // quizzes
  router.post(
    '/',
    requireAuth,
    createQuizValidator,
    validateRequest,
    asyncHandler(quizBuilderController.createQuiz)
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
    '/:quiz_id/share',
    requireAuth,
    quizIdParam,
    shareQuizValidator,
    validateRequest,
    asyncHandler(quizBuilderController.shareQuiz)
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
  router.delete(
    '/:question_id',
    requireAuth,
    questionIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.deleteQuizQuestion)
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
  router.delete(
    '/:option_id',
    requireAuth,
    optionIdParam,
    validateRequest,
    asyncHandler(quizBuilderController.deleteQuestionOption)
  );

  return router;
}

