/**
 * Admin routes.
 *
 * Mounted at `/api/admin`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import {
  createGlobalQuestionBody,
  createStoryLevelBody,
  addPoolBody,
  replacePoolBody,
  createClassicCategoryBody,
  levelIdParam,
  categoryIdParam,
  questionIdParam,
  modeParam,
  searchQuestionsQuery,
  listQuestionsQuery,
  listPoolQuery,
  seedPoolBody,
} from '../validator/AdminValidator.js';

export default function createAdminRouter(adminController) {
  const router = Router();

  // story levels
  router.get('/story/levels', requireAdmin, asyncHandler(adminController.listStoryLevels));
  router.get(
    '/story/pool/assigned',
    requireAdmin,
    asyncHandler(adminController.listStoryAssignedQuestionIds)
  );

  router.post(
    '/story/levels',
    requireAdmin,
    createStoryLevelBody,
    validateRequest,
    asyncHandler(adminController.createStoryLevel)
  );

  router.delete(
    '/story/levels/:level_id',
    requireAdmin,
    levelIdParam,
    validateRequest,
    asyncHandler(adminController.deleteStoryLevel)
  );

  router.post(
    '/story/levels/:level_id/pool',
    requireAdmin,
    levelIdParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.addStoryLevelPool)
  );

  router.get(
    '/story/levels/:level_id/pool/questions',
    requireAdmin,
    levelIdParam,
    listPoolQuery,
    validateRequest,
    asyncHandler(adminController.listStoryLevelPoolQuestions)
  );

  router.get(
    '/story/levels/:level_id/pool/ids',
    requireAdmin,
    levelIdParam,
    validateRequest,
    asyncHandler(adminController.listStoryLevelPoolQuestionIds)
  );

  router.delete(
    '/story/levels/:level_id/pool',
    requireAdmin,
    levelIdParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.removeStoryLevelPoolQuestions)
  );

  router.put(
    '/story/levels/:level_id/pool',
    requireAdmin,
    levelIdParam,
    replacePoolBody,
    validateRequest,
    asyncHandler(adminController.replaceStoryLevelPool)
  );

  router.post(
    '/story/levels/:level_id/pool/seed',
    requireAdmin,
    levelIdParam,
    seedPoolBody,
    validateRequest,
    asyncHandler(adminController.seedStoryLevelPool)
  );

  // global question bank
  router.post(
    '/questions',
    requireAdmin,
    createGlobalQuestionBody,
    validateRequest,
    asyncHandler(adminController.createGlobalQuestion)
  );

  router.get(
    '/questions',
    requireAdmin,
    listQuestionsQuery,
    validateRequest,
    asyncHandler(adminController.listGlobalQuestions)
  );

  router.get(
    '/questions/search',
    requireAdmin,
    searchQuestionsQuery,
    validateRequest,
    asyncHandler(adminController.searchGlobalQuestions)
  );

  router.delete(
    '/questions/:question_id',
    requireAdmin,
    questionIdParam,
    validateRequest,
    asyncHandler(adminController.deleteGlobalQuestion)
  );

  router.get(
    '/modes/:mode/pool',
    requireAdmin,
    modeParam,
    validateRequest,
    asyncHandler(adminController.modePoolSummary)
  );

  router.post(
    '/modes/:mode/pool/seed',
    requireAdmin,
    modeParam,
    seedPoolBody,
    validateRequest,
    asyncHandler(adminController.seedModePool)
  );

  router.get(
    '/modes/:mode/pool/questions',
    requireAdmin,
    modeParam,
    listPoolQuery,
    validateRequest,
    asyncHandler(adminController.listModePoolQuestions)
  );

  router.get(
    '/modes/:mode/pool/ids',
    requireAdmin,
    modeParam,
    validateRequest,
    asyncHandler(adminController.modePoolQuestionIds)
  );

  router.post(
    '/modes/:mode/pool',
    requireAdmin,
    modeParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.addModePool)
  );

  router.delete(
    '/modes/:mode/pool',
    requireAdmin,
    modeParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.removeModePoolQuestions)
  );

  router.put(
    '/modes/:mode/pool',
    requireAdmin,
    modeParam,
    replacePoolBody,
    validateRequest,
    asyncHandler(adminController.replaceModePool)
  );

  // classic categories + category pools
  router.get(
    '/classic/categories',
    requireAdmin,
    asyncHandler(adminController.listClassicCategories)
  );

  router.post(
    '/classic/categories',
    requireAdmin,
    createClassicCategoryBody,
    validateRequest,
    asyncHandler(adminController.createClassicCategory)
  );

  router.delete(
    '/classic/categories/:category_id',
    requireAdmin,
    categoryIdParam,
    validateRequest,
    asyncHandler(adminController.deleteClassicCategory)
  );

  router.get(
    '/classic/categories/:category_id/pool/questions',
    requireAdmin,
    categoryIdParam,
    listPoolQuery,
    validateRequest,
    asyncHandler(adminController.listClassicCategoryPoolQuestions)
  );

  router.get(
    '/classic/categories/:category_id/pool/ids',
    requireAdmin,
    categoryIdParam,
    validateRequest,
    asyncHandler(adminController.listClassicCategoryPoolQuestionIds)
  );

  router.post(
    '/classic/categories/:category_id/pool',
    requireAdmin,
    categoryIdParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.addClassicCategoryPool)
  );

  router.delete(
    '/classic/categories/:category_id/pool',
    requireAdmin,
    categoryIdParam,
    addPoolBody,
    validateRequest,
    asyncHandler(adminController.removeClassicCategoryPool)
  );

  router.put(
    '/classic/categories/:category_id/pool',
    requireAdmin,
    categoryIdParam,
    replacePoolBody,
    validateRequest,
    asyncHandler(adminController.replaceClassicCategoryPool)
  );

  router.post(
    '/classic/categories/:category_id/pool/seed',
    requireAdmin,
    categoryIdParam,
    seedPoolBody,
    validateRequest,
    asyncHandler(adminController.seedClassicCategoryPool)
  );

  return router;
}
