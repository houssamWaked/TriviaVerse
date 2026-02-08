/**
 * Story mode controller.
 */
export class StoryController {
  constructor(storyService, sessionStartService) {
    this.storyService = storyService;
    this.sessionStartService = sessionStartService;
  }

  listLevels = async (req, res) => {
    const data = await this.storyService.listLevels();
    res.status(200).json(data);
  };

  progress = async (req, res) => {
    const data = await this.storyService.getUserProgress(req.user.id);
    res.status(200).json(data);
  };

  start = async (req, res) => {
    const data = await this.sessionStartService.startStorySession(
      req.user?.id || null,
      req.body.level_number
    );
    res.status(201).json(data);
  };
}
