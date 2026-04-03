/**
 * Millionaire mode controller.
 */
import type { Request, Response } from 'express';

type ConfigErrorLike = {
  code?: string;
};

type MillionaireLadderRepositoryLike = {
  listAll(): Promise<unknown[]>;
};

type SessionStartServiceLike = {
  startMillionaireSession(userId: string | null, ladderId: string | null): Promise<unknown>;
};

export class MillionaireController {
  millionaireLadderRepository: MillionaireLadderRepositoryLike;
  sessionStartService: SessionStartServiceLike;

  constructor(
    millionaireLadderRepository: MillionaireLadderRepositoryLike,
    sessionStartService: SessionStartServiceLike
  ) {
    this.millionaireLadderRepository = millionaireLadderRepository;
    this.sessionStartService = sessionStartService;
  }

  config = async (_req: Request, res: Response) => {
    let ladders: unknown[] = [];
    try {
      ladders = await this.millionaireLadderRepository.listAll();
    } catch (err) {
      if ((err as ConfigErrorLike)?.code !== 'NOT_CONFIGURED') {
        throw err;
      }
      ladders = [];
    }
    res.status(200).json({ ladders });
  };

  start = async (req: Request, res: Response) => {
    const ladderId = typeof req.body?.ladder_id === 'string' ? req.body.ladder_id : null;
    const data = await this.sessionStartService.startMillionaireSession(req.user?.id || null, ladderId);
    res.status(201).json(data);
  };
}
