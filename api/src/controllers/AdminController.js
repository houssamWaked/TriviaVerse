/**
 * Admin controller.
 */
export class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  listStoryLevels = async (req, res) => {
    const data = await this.adminService.listStoryLevels();
    res.status(200).json(data);
  };

  createStoryLevel = async (req, res) => {
    const data = await this.adminService.createStoryLevel(req.body);
    res.status(201).json(data);
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

  modePoolSummary = async (req, res) => {
    const data = await this.adminService.listModePool(req.params.mode);
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
}
