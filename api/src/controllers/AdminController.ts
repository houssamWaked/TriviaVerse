/**
 * Admin controller.
 */
import type { Request, Response } from 'express';

type AdminServiceLike = {
  [key: string]: (...args: any[]) => Promise<unknown>;
};

export class AdminController {
  adminService: AdminServiceLike;

  constructor(adminService: AdminServiceLike) {
    this.adminService = adminService;
  }

  listQuizReports = async (req: Request, res: Response) => {
    const data = await this.adminService.listQuizReports(req.query);
    res.status(200).json(data);
  };

  resolveQuizReport = async (req: Request, res: Response) => {
    const data = await this.adminService.resolveQuizReport(req.params.report_id, {
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  deleteCustomQuizAsAdmin = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteCustomQuizAsAdmin(req.params.quiz_id);
    res.status(200).json(data);
  };

  banUser = async (req: Request, res: Response) => {
    const data = await this.adminService.banUser(req.params.user_id, {
      reason: req.body?.reason || null,
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  listStoryLevels = async (_req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevels();
    res.status(200).json(data);
  };

  createStoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.createStoryLevel(req.body);
    res.status(201).json(data);
  };

  deleteStoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteStoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  addStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  seedStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedStoryLevelPool(req.params.level_id, req.body);
    res.status(200).json(data);
  };

  listStoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevelPoolQuestions(
      req.params.level_id,
      req.query
    );
    res.status(200).json(data);
  };

  listStoryLevelPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listStoryLevelPoolQuestionIds(req.params.level_id);
    res.status(200).json(data);
  };

  listAllAssignedQuestionIds = async (_req: Request, res: Response) => {
    const data = await this.adminService.listAllAssignedQuestionIds();
    res.status(200).json(data);
  };

  removeStoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.removeStoryLevelPoolQuestions(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceStoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  createGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.createGlobalQuestion(req.body);
    res.status(201).json(data);
  };

  listGlobalQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listGlobalQuestions(req.query);
    res.status(200).json(data);
  };

  addModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.addQuestionsToModePool(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  getGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.getGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  patchGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.patchGlobalQuestion(req.params.question_id, req.body);
    res.status(200).json(data);
  };

  replaceGlobalQuestionOptions = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceGlobalQuestionOptions(
      req.params.question_id,
      req.body
    );
    res.status(200).json(data);
  };

  deleteGlobalQuestion = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  modePoolSummary = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePool(req.params.mode);
    res.status(200).json(data);
  };

  modePoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePoolQuestionIds(req.params.mode);
    res.status(200).json(data);
  };

  seedModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedModePool(req.params.mode, req.body);
    res.status(200).json(data);
  };

  listModePoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listModePoolQuestions(req.params.mode, req.query);
    res.status(200).json(data);
  };

  removeModePoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.removeModePoolQuestions(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceModePool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceModePool(req.params.mode, req.body.question_ids);
    res.status(200).json(data);
  };

  listClassicCategories = async (_req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategories();
    res.status(200).json(data);
  };

  createClassicCategory = async (req: Request, res: Response) => {
    const data = await this.adminService.createClassicCategory(req.body);
    res.status(201).json(data);
  };

  deleteClassicCategory = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteClassicCategory(req.params.category_id);
    res.status(200).json(data);
  };

  listClassicCategoryPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryPoolQuestions(
      req.params.category_id,
      req.query
    );
    res.status(200).json(data);
  };

  listClassicCategoryPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryPoolQuestionIds(req.params.category_id);
    res.status(200).json(data);
  };

  addClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  removeClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.removeClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  seedClassicCategoryPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedClassicCategoryPool(req.params.category_id, req.body);
    res.status(200).json(data);
  };

  listClassicCategoryLevels = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevels(req.params.category_id);
    res.status(200).json(data);
  };

  createClassicCategoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.createClassicCategoryLevel(
      req.params.category_id,
      req.body
    );
    res.status(201).json(data);
  };

  deleteClassicCategoryLevel = async (req: Request, res: Response) => {
    const data = await this.adminService.deleteClassicCategoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  listClassicCategoryLevelPoolQuestions = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestions(
      req.params.level_id,
      req.query
    );
    res.status(200).json(data);
  };

  listClassicCategoryLevelPoolQuestionIds = async (req: Request, res: Response) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestionIds(
      req.params.level_id
    );
    res.status(200).json(data);
  };

  addClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.addClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  removeClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.removeClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.replaceClassicCategoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  seedClassicCategoryLevelPool = async (req: Request, res: Response) => {
    const data = await this.adminService.seedClassicCategoryLevelPool(
      req.params.level_id,
      req.body
    );
    res.status(200).json(data);
  };
}
