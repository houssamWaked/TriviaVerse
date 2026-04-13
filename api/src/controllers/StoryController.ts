/**
 * Story mode controller.
 */
import type { Request, Response } from 'express';

type StoryServiceLike = {
  listLevels(): Promise<unknown>;
  getUserProgress(userId: string): Promise<unknown>;
};

type SessionStartServiceLike = {
  startStorySession(userId: string | null, levelNumber: unknown): Promise<unknown>;
};

export class StoryController {
  storyService: StoryServiceLike;
  sessionStartService: SessionStartServiceLike;

  /**
   * Construct the story controller.
   * @param storyService Service for reading levels and progress.
   * @param sessionStartService Service for starting story sessions.
   * @returns A `StoryController` instance.
   */
  constructor(storyService: StoryServiceLike, sessionStartService: SessionStartServiceLike) {
    this.storyService = storyService;
    this.sessionStartService = sessionStartService;
  }

  /**
   * List all story levels.
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with levels.
   */
  listLevels = async (_req: Request, res: Response) => {
    const data = await this.storyService.listLevels();
    res.status(200).json(data);
  };

  /**
   * Get the authenticated user's story progress.
   * @param req Express request (expects `req.user`).
   * @param res Express response.
   * @returns A 200 response with progress payload.
   */
  progress = async (req: Request, res: Response) => {
    const data = await this.storyService.getUserProgress(req.user!.id);
    res.status(200).json(data);
  };

  /**
   * Start a story session for a given level number.
   * @param req Express request (uses `req.user?.id` and `req.body.level_number`).
   * @param res Express response.
   * @returns A 201 response with session start payload.
   */
  start = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startStorySession(
      req.user?.id || null,
      req.body.level_number
    );
    res.status(201).json(data);
  };
}
