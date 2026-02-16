/**
 * Admin controller.
 */
export class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  listQuizReports = async (req, res) => {
    const data = await this.adminService.listQuizReports(req.query);
    res.status(200).json(data);
  };

  resolveQuizReport = async (req, res) => {
    const data = await this.adminService.resolveQuizReport(req.params.report_id, {
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  deleteCustomQuizAsAdmin = async (req, res) => {
    const data = await this.adminService.deleteCustomQuizAsAdmin(req.params.quiz_id);
    res.status(200).json(data);
  };

  banUser = async (req, res) => {
    const data = await this.adminService.banUser(req.params.user_id, {
      reason: req.body?.reason || null,
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  unbanUser = async (req, res) => {
    const data = await this.adminService.unbanUser(req.params.user_id, {
      adminEmail: req.user?.email || null,
    });
    res.status(200).json(data);
  };

  listStoryLevels = async (req, res) => {
    const data = await this.adminService.listStoryLevels();
    res.status(200).json(data);
  };

  createStoryLevel = async (req, res) => {
    const data = await this.adminService.createStoryLevel(req.body);
    res.status(201).json(data);
  };

  deleteStoryLevel = async (req, res) => {
    const data = await this.adminService.deleteStoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  addStoryLevelPool = async (req, res) => {
    const data = await this.adminService.addStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  seedStoryLevelPool = async (req, res) => {
    const data = await this.adminService.seedStoryLevelPool(req.params.level_id, req.body);
    res.status(200).json(data);
  };

  listStoryLevelPoolQuestions = async (req, res) => {
    const data = await this.adminService.listStoryLevelPoolQuestions(req.params.level_id, req.query);
    res.status(200).json(data);
  };

  listStoryLevelPoolQuestionIds = async (req, res) => {
    const data = await this.adminService.listStoryLevelPoolQuestionIds(req.params.level_id);
    res.status(200).json(data);
  };

  listStoryAssignedQuestionIds = async (req, res) => {
    const data = await this.adminService.listStoryAssignedQuestionIds();
    res.status(200).json(data);
  };

  listAllAssignedQuestionIds = async (req, res) => {
    const data = await this.adminService.listAllAssignedQuestionIds();
    res.status(200).json(data);
  };

  removeStoryLevelPoolQuestions = async (req, res) => {
    const data = await this.adminService.removeStoryLevelPoolQuestions(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceStoryLevelPool = async (req, res) => {
    const data = await this.adminService.replaceStoryLevelPool(
      req.params.level_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  createGlobalQuestion = async (req, res) => {
    const data = await this.adminService.createGlobalQuestion(req.body);
    res.status(201).json(data);
  };

  listGlobalQuestions = async (req, res) => {
    const data = await this.adminService.listGlobalQuestions(req.query);
    res.status(200).json(data);
  };

  addModePool = async (req, res) => {
    const data = await this.adminService.addQuestionsToModePool(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  searchGlobalQuestions = async (req, res) => {
    const data = await this.adminService.searchGlobalQuestions(req.query);
    res.status(200).json(data);
  };

  getGlobalQuestion = async (req, res) => {
    const data = await this.adminService.getGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  patchGlobalQuestion = async (req, res) => {
    const data = await this.adminService.patchGlobalQuestion(req.params.question_id, req.body);
    res.status(200).json(data);
  };

  replaceGlobalQuestionOptions = async (req, res) => {
    const data = await this.adminService.replaceGlobalQuestionOptions(
      req.params.question_id,
      req.body
    );
    res.status(200).json(data);
  };

  deleteGlobalQuestion = async (req, res) => {
    const data = await this.adminService.deleteGlobalQuestion(req.params.question_id);
    res.status(200).json(data);
  };

  modePoolSummary = async (req, res) => {
    const data = await this.adminService.listModePool(req.params.mode);
    res.status(200).json(data);
  };

  modePoolQuestionIds = async (req, res) => {
    const data = await this.adminService.listModePoolQuestionIds(req.params.mode);
    res.status(200).json(data);
  };

  seedModePool = async (req, res) => {
    const data = await this.adminService.seedModePool(req.params.mode, req.body);
    res.status(200).json(data);
  };

  listModePoolQuestions = async (req, res) => {
    const data = await this.adminService.listModePoolQuestions(req.params.mode, req.query);
    res.status(200).json(data);
  };

  removeModePoolQuestions = async (req, res) => {
    const data = await this.adminService.removeModePoolQuestions(
      req.params.mode,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceModePool = async (req, res) => {
    const data = await this.adminService.replaceModePool(req.params.mode, req.body.question_ids);
    res.status(200).json(data);
  };

  // classic categories + pools
  listClassicCategories = async (req, res) => {
    const data = await this.adminService.listClassicCategories();
    res.status(200).json(data);
  };

  createClassicCategory = async (req, res) => {
    const data = await this.adminService.createClassicCategory(req.body);
    res.status(201).json(data);
  };

  deleteClassicCategory = async (req, res) => {
    const data = await this.adminService.deleteClassicCategory(req.params.category_id);
    res.status(200).json(data);
  };

  listClassicCategoryPoolQuestions = async (req, res) => {
    const data = await this.adminService.listClassicCategoryPoolQuestions(
      req.params.category_id,
      req.query
    );
    res.status(200).json(data);
  };

  listClassicCategoryPoolQuestionIds = async (req, res) => {
    const data = await this.adminService.listClassicCategoryPoolQuestionIds(req.params.category_id);
    res.status(200).json(data);
  };

  addClassicCategoryPool = async (req, res) => {
    const data = await this.adminService.addClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  removeClassicCategoryPool = async (req, res) => {
    const data = await this.adminService.removeClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  replaceClassicCategoryPool = async (req, res) => {
    const data = await this.adminService.replaceClassicCategoryPool(
      req.params.category_id,
      req.body.question_ids
    );
    res.status(200).json(data);
  };

  seedClassicCategoryPool = async (req, res) => {
    const data = await this.adminService.seedClassicCategoryPool(req.params.category_id, req.body);
    res.status(200).json(data);
  };

  // classic category levels
  listClassicCategoryLevels = async (req, res) => {
    const data = await this.adminService.listClassicCategoryLevels(req.params.category_id);
    res.status(200).json(data);
  };

  createClassicCategoryLevel = async (req, res) => {
    const data = await this.adminService.createClassicCategoryLevel(req.params.category_id, req.body);
    res.status(201).json(data);
  };

  deleteClassicCategoryLevel = async (req, res) => {
    const data = await this.adminService.deleteClassicCategoryLevel(req.params.level_id);
    res.status(200).json(data);
  };

  listClassicCategoryLevelPoolQuestions = async (req, res) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestions(req.params.level_id, req.query);
    res.status(200).json(data);
  };

  listClassicCategoryLevelPoolQuestionIds = async (req, res) => {
    const data = await this.adminService.listClassicCategoryLevelPoolQuestionIds(req.params.level_id);
    res.status(200).json(data);
  };

  addClassicCategoryLevelPool = async (req, res) => {
    const data = await this.adminService.addClassicCategoryLevelPool(req.params.level_id, req.body.question_ids);
    res.status(200).json(data);
  };

  removeClassicCategoryLevelPool = async (req, res) => {
    const data = await this.adminService.removeClassicCategoryLevelPool(req.params.level_id, req.body.question_ids);
    res.status(200).json(data);
  };

  replaceClassicCategoryLevelPool = async (req, res) => {
    const data = await this.adminService.replaceClassicCategoryLevelPool(req.params.level_id, req.body.question_ids);
    res.status(200).json(data);
  };

  seedClassicCategoryLevelPool = async (req, res) => {
    const data = await this.adminService.seedClassicCategoryLevelPool(req.params.level_id, req.body);
    res.status(200).json(data);
  };
}
