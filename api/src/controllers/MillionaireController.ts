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

// HTTP adapter for Millionaire mode endpoints (ladder config + session start).
export class MillionaireController {
  millionaireLadderRepository: MillionaireLadderRepositoryLike;
  sessionStartService: SessionStartServiceLike;

  /**
   * Construct the millionaire controller.
   * @param millionaireLadderRepository Repository for ladder definitions (optional by migration).
   * @param sessionStartService Service that creates Millionaire sessions.
   * @returns A `MillionaireController` instance.
   */
  constructor(
    millionaireLadderRepository: MillionaireLadderRepositoryLike,
    sessionStartService: SessionStartServiceLike
  ) {
    this.millionaireLadderRepository = millionaireLadderRepository;
    this.sessionStartService = sessionStartService;
  }

  /**
   * Return millionaire ladder config (empty when ladder table isn't configured).
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with `{ ladders }`.
   */
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

  /**
   * Start a millionaire session using an optional ladder id.
   * @param req Express request (optional `ladder_id` in `req.body`).
   * @param res Express response.
   * @returns A 201 response with session id and initial state.
   */
  start = async (req: Request, res: Response) => {
    const ladderId = typeof req.body?.ladder_id === 'string' ? req.body.ladder_id : null;
    const data = await this.sessionStartService.startMillionaireSession(req.user?.id || null, ladderId);
    res.status(201).json(data);
  };
}
