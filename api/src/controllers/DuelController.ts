/**
 * Duel controller.
 */
import type { Request, Response } from 'express';

type DuelServiceLike = {
  listMyDuels(userId: string): Promise<unknown>;
  createChallenge(userId: string, body: unknown): Promise<unknown>;
  acceptChallenge(userId: string, duelId: string): Promise<unknown>;
  declineChallenge(userId: string, duelId: string): Promise<unknown>;
  cancelChallenge(userId: string, duelId: string): Promise<unknown>;
  getLiveState(userId: string, duelId: string): Promise<unknown>;
  submitLiveAnswer(userId: string, duelId: string, body: unknown): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export class DuelController {
  duelService: DuelServiceLike;

  constructor(duelService: DuelServiceLike) {
    this.duelService = duelService;
  }

  listMine = async (req: Request, res: Response) => {
    const data = await this.duelService.listMyDuels(req.user!.id);
    res.status(200).json({ entries: data });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.duelService.createChallenge(req.user!.id, req.body);
    res.status(201).json(data);
  };

  accept = async (req: Request, res: Response) => {
    const data = await this.duelService.acceptChallenge(req.user!.id, getParam(req.params.duel_id));
    res.status(200).json(data);
  };

  decline = async (req: Request, res: Response) => {
    const data = await this.duelService.declineChallenge(
      req.user!.id,
      getParam(req.params.duel_id)
    );
    res.status(200).json(data);
  };

  cancel = async (req: Request, res: Response) => {
    const data = await this.duelService.cancelChallenge(req.user!.id, getParam(req.params.duel_id));
    res.status(200).json(data);
  };

  liveState = async (req: Request, res: Response) => {
    const data = await this.duelService.getLiveState(req.user!.id, getParam(req.params.duel_id));
    res.status(200).json(data);
  };

  liveAnswer = async (req: Request, res: Response) => {
    const data = await this.duelService.submitLiveAnswer(
      req.user!.id,
      getParam(req.params.duel_id),
      req.body
    );
    res.status(200).json(data);
  };
}
