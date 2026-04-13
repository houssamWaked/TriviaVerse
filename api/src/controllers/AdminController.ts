/**
 * Admin controller.
 */
import type { Request, Response } from 'express';

type AdminServiceLike = {
  [key: string]: (...args: any[]) => Promise<unknown>;
};

// HTTP adapter for admin-only moderation/content-management endpoints.
export class AdminController {
  adminService: AdminServiceLike;

  /**
   * Construct a controller that delegates to admin services.
   * @param adminService Service containing admin operations (moderation + pool management).
   * @returns An `AdminController` instance.
   */
  constructor(adminService: AdminServiceLike) {
    this.adminService = adminService;
  }

  /**
   * List quiz reports for moderation.
   * @param req Express request (uses query filters like status/limit/offset).
   * @param res Express response.
   * @returns A 200 response containing report entries.
   */
  listQuizReports = async (req: Request, res: Response) => {
    const data = await this.adminService.listQuizReports(req.query);
    res.status(200).json(data);
  };

  /**
   * Resolve a quiz report.
   * @param req Express request (expects `:report_id` route param).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  resolveQuizReport = async (req: Request, res: Response) => {
    const data = await this.adminService.resolveQuizReport(req.params.report_id, {
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  /**
   * Delete a custom quiz as an admin (best-effort cleanup of related rows).
   * @param req Express request (expects `:quiz_id` route param).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  deleteCustomQuizAsAdmin = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteCustomQuizAsAdmin(req.params.quiz_id);
    res.status(200).json(data);
  };

  /**
   * Ban a user account.
   * @param req Express request (expects `:user_id` and optional `{ reason }` body).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  banUser = async (req: Request, res: Response) => {
    const data = await this.adminService.banUser(req.params.user_id, {
      reason: req.body?.reason || null,
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  /**
   * List story levels.
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with level definitions (and pool counts when available).
   */
  listStoryLevels = async (_req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevels();
    res.status(200).json(data);
  };

  /**
   * Create a new story level.
   * @param req Express request (level payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created level.
   */
  createStoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.createStoryLevel(req.body);
    res.status(201).json(data);
  };

  /**
   * Delete a story level (best-effort cleanup of pool/progress).
   * @param req Express request (expects `:level_id`).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  deleteStoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteStoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  /**
   * Add specific question ids to a story level's pool.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  addStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Seed a story level pool from random global questions (difficulty range aware).
   * @param req Express request (expects `:level_id` and seed payload).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  seedStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedStoryLevelPool(req.params.level_id, req.body);
    res.status(200).json(data);
  };

  /**
   * List paged story level pool questions (question text + metadata).
   * @param req Express request (expects `:level_id` plus paging query).
   * @param res Express response.
   * @returns A 200 response with questions.
   */
  listStoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevelPoolQuestions(
      req.params.level_id,
      req.query
    );
    res.status(200).json(data);
  };

  /**
   * List all question ids assigned to a story level.
   * @param req Express request (expects `:level_id`).
   * @param res Express response.
   * @returns A 200 response with id list.
   */
  listStoryLevelPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevelPoolQuestionIds(req.params.level_id);
    res.status(200).json(data);
  };

  /**
   * List all assigned question ids across all pools (story/modes/classic).
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with a combined id set and per-pool breakdown.
   */
  listAllAssignedQuestionIds = async (_req: Request, res: Response) => {
    const data = await this.adminService.listAllAssignedQuestionIds();
    res.status(200).json(data);
  };

  /**
   * Remove specific questions from a story level pool.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with remove count.
   */
  removeStoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.removeStoryLevelPoolQuestions(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Replace an entire story level pool with the provided question ids.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with final pool size.
   */
  replaceStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Create a new global (non-quiz-owned) question.
   * @param req Express request (question + options payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with created id.
   */
  createGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.createGlobalQuestion(req.body);
    res.status(201).json(data);
  };

  /**
   * List global questions with optional query filtering.
   * @param req Express request (query contains search/paging/assigned).
   * @param res Express response.
   * @returns A 200 response with results.
   */
  listGlobalQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listGlobalQuestions(req.query);
    res.status(200).json(data);
  };

  /**
   * Add questions to a specific mode's question pool.
   * @param req Express request (expects `:mode` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  addModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.addQuestionsToModePool(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Fetch a single global question and its options.
   * @param req Express request (expects `:question_id`).
   * @param res Express response.
   * @returns A 200 response with question + options.
   */
  getGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.getGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  /**
   * Patch editable fields on a global question.
   * @param req Express request (expects `:question_id` and patch body).
   * @param res Express response.
   * @returns A 200 response with updated fields.
   */
  patchGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.patchGlobalQuestion(req.params.question_id, req.body);
    res.status(200).json(data);
  };

  /**
   * Replace all options for a global question.
   * @param req Express request (expects `:question_id` and `{ options }`).
   * @param res Express response.
   * @returns A 200 response with the newly created option rows.
   */
  replaceGlobalQuestionOptions = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceGlobalQuestionOptions(
      req.params.question_id,
      req.body
    );
    res.status(200).json(data);
  };

  /**
   * Delete a global question (best-effort removal from pools and session references).
   * @param req Express request (expects `:question_id`).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  deleteGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  /**
   * Get a summary (count) of a mode pool.
   * @param req Express request (expects `:mode`).
   * @param res Express response.
   * @returns A 200 response with pool count.
   */
  modePoolSummary = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePool(req.params.mode);
    res.status(200).json(data);
  };

  /**
   * List all question ids assigned to a mode pool.
   * @param req Express request (expects `:mode`).
   * @param res Express response.
   * @returns A 200 response with id list.
   */
  modePoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePoolQuestionIds(req.params.mode);
    res.status(200).json(data);
  };

  /**
   * Seed a mode pool from random global questions.
   * @param req Express request (expects `:mode` and seed payload).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  seedModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedModePool(req.params.mode, req.body);
    res.status(200).json(data);
  };

  /**
   * List paged questions in a mode pool.
   * @param req Express request (expects `:mode` and paging query).
   * @param res Express response.
   * @returns A 200 response with questions.
   */
  listModePoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePoolQuestions(req.params.mode, req.query);
    res.status(200).json(data);
  };

  /**
   * Remove questions from a mode pool.
   * @param req Express request (expects `:mode` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with remove count.
   */
  removeModePoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.removeModePoolQuestions(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Replace an entire mode pool with the provided question ids.
   * @param req Express request (expects `:mode` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with final pool size.
   */
  replaceModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceModePool(req.params.mode, req.body.question_ids);
    res.status(200).json(data);
  };

  /**
   * List classic categories (with pool counts when configured).
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with categories.
   */
  listClassicCategories = async (_req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategories();
    res.status(200).json(data);
  };

  /**
   * Create a classic category.
   * @param req Express request (category payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with created category.
   */
  createClassicCategory = async (req: Request, res: Response) => {
    const data = await this.adminService.createClassicCategory(req.body);
    res.status(201).json(data);
  };

  /**
   * Delete a classic category.
   * @param req Express request (expects `:category_id`).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  deleteClassicCategory = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteClassicCategory(req.params.category_id);
    res.status(200).json(data);
  };

  /**
   * List paged questions for a classic category pool.
   * @param req Express request (expects `:category_id` and paging query).
   * @param res Express response.
   * @returns A 200 response with questions.
   */
  listClassicCategoryPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryPoolQuestions(
      req.params.category_id,
      req.query
    );
    res.status(200).json(data);
  };

  /**
   * List all question ids assigned to a classic category pool.
   * @param req Express request (expects `:category_id`).
   * @param res Express response.
   * @returns A 200 response with id list.
   */
  listClassicCategoryPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryPoolQuestionIds(req.params.category_id);
    res.status(200).json(data);
  };

  /**
   * Add questions to a classic category pool.
   * @param req Express request (expects `:category_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  addClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Remove questions from a classic category pool.
   * @param req Express request (expects `:category_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with remove count.
   */
  removeClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.removeClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Replace a classic category pool with the provided question ids.
   * @param req Express request (expects `:category_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with final pool size.
   */
  replaceClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Seed a classic category pool from random global questions.
   * @param req Express request (expects `:category_id` and seed payload).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  seedClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedClassicCategoryPool(req.params.category_id, req.body);
    res.status(200).json(data);
  };

  /**
   * List classic category levels for a category (story-like classic progression).
   * @param req Express request (expects `:category_id`).
   * @param res Express response.
   * @returns A 200 response with levels and pool counts.
   */
  listClassicCategoryLevels = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevels(req.params.category_id);
    res.status(200).json(data);
  };

  /**
   * Create a classic category level.
   * @param req Express request (expects `:category_id` and payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created level.
   */
  createClassicCategoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.createClassicCategoryLevel(
      req.params.category_id,
      req.body
    );
    res.status(201).json(data);
  };

  /**
   * Delete a classic category level.
   * @param req Express request (expects `:level_id`).
   * @param res Express response.
   * @returns A 200 response indicating success.
   */
  deleteClassicCategoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteClassicCategoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  /**
   * List paged questions in a classic level pool.
   * @param req Express request (expects `:level_id` and paging query).
   * @param res Express response.
   * @returns A 200 response with questions.
   */
  listClassicCategoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestions(
      req.params.level_id,
      req.query
    );
    res.status(200).json(data);
  };

  /**
   * List all question ids assigned to a classic level pool.
   * @param req Express request (expects `:level_id`).
   * @param res Express response.
   * @returns A 200 response with id list.
   */
  listClassicCategoryLevelPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestionIds(
      req.params.level_id
    );
    res.status(200).json(data);
  };

  /**
   * Add questions to a classic level pool.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  addClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Remove questions from a classic level pool.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with remove count.
   */
  removeClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.removeClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Replace a classic level pool with the provided question ids.
   * @param req Express request (expects `:level_id` and `{ question_ids }`).
   * @param res Express response.
   * @returns A 200 response with final pool size.
   */
  replaceClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  /**
   * Seed a classic level pool from random global questions (difficulty range aware).
   * @param req Express request (expects `:level_id` and seed payload).
   * @param res Express response.
   * @returns A 200 response with add count.
   */
  seedClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedClassicCategoryLevelPool(
      req.params.level_id,
      req.body
    );
    res.status(200).json(data);
  };
}
