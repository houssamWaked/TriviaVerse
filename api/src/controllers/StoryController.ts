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

  constructor(storyService: StoryServiceLike, sessionStartService: SessionStartServiceLike) {
    this.storyService = storyService;
    this.sessionStartService = sessionStartService;
  }

  listLevels = async (_req: Request, res: Response) => {
    const data = await this.storyService.listLevels();
    res.status(200).json(data);
  };

  progress = async (req: Request, res: Response) => {
    const data = await this.storyService.getUserProgress(req.user!.id);
    res.status(200).json(data);
  };

  start = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startStorySession(
      req.user?.id || null,
      req.body.level_number
    );
    res.status(201).json(data);
  };
}
