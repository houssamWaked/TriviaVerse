/**
 * Quiz builder controller.
 */
import type { Request, Response } from 'express';

type QuizBuilderServiceLike = {
  listQuizzes(userId: string): Promise<unknown>;
  createQuiz(userId: string, body: unknown): Promise<unknown>;
  getQuiz(userId: string, quizId: string): Promise<unknown>;
  patchQuiz(userId: string, quizId: string, body: unknown): Promise<unknown>;
  publishQuiz(userId: string, quizId: string): Promise<unknown>;
  listQuizQuestions(userId: string, quizId: string): Promise<unknown>;
  addQuizQuestion(userId: string, quizId: string, body: unknown): Promise<unknown>;
  patchQuizQuestion(userId: string, questionId: string, body: unknown): Promise<unknown>;
  addQuestionOption(userId: string, questionId: string, body: unknown): Promise<unknown>;
  patchQuestionOption(userId: string, optionId: string, body: unknown): Promise<unknown>;
  rateQuiz(userId: string, quizId: string, rating: unknown): Promise<unknown>;
  listQuizAccess(userId: string, quizId: string): Promise<unknown>;
  addQuizAccess(userId: string, quizId: string, body: unknown): Promise<unknown>;
  removeQuizAccess(userId: string, quizId: string, targetUserId: string): Promise<unknown>;
  listMyPlayedQuizzes(userId: string): Promise<unknown>;
  deleteQuiz(userId: string, quizId: string): Promise<unknown>;
};

type SessionStartServiceLike = {
  startCustomQuizSession(userId: string | null, quizId: string): Promise<unknown>;
};

type QuizReportServiceLike = {
  reportQuiz(userId: string, quizId: string, body: unknown): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export class QuizBuilderController {
  quizBuilderService: QuizBuilderServiceLike;
  sessionStartService: SessionStartServiceLike;
  quizReportService: QuizReportServiceLike;

  constructor(
    quizBuilderService: QuizBuilderServiceLike,
    sessionStartService: SessionStartServiceLike,
    quizReportService: QuizReportServiceLike
  ) {
    this.quizBuilderService = quizBuilderService;
    this.sessionStartService = sessionStartService;
    this.quizReportService = quizReportService;
  }

  listQuizzes = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizzes(req.user!.id);
    res.status(200).json(data);
  };

  createQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.createQuiz(req.user!.id, req.body);
    res.status(201).json(data);
  };

  getQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.getQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  patchQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(200).json(data);
  };

  publishQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.publishQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  listQuizQuestions = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizQuestions(
      req.user!.id,
      getParam(req.params.quiz_id)
    );
    res.status(200).json(data);
  };

  addQuizQuestion = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuizQuestion(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };

  patchQuizQuestion = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuizQuestion(
      req.user!.id,
      getParam(req.params.question_id),
      req.body
    );
    res.status(200).json(data);
  };

  addQuestionOption = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuestionOption(
      req.user!.id,
      getParam(req.params.question_id),
      req.body
    );
    res.status(201).json(data);
  };

  patchQuestionOption = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuestionOption(
      req.user!.id,
      getParam(req.params.option_id),
      req.body
    );
    res.status(200).json(data);
  };

  rateQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.rateQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body.rating
    );
    res.status(200).json(data);
  };

  listQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id)
    );
    res.status(200).json(data);
  };

  addQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };

  removeQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.removeQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id),
      getParam(req.params.user_id)
    );
    res.status(200).json(data);
  };

  startCustomSession = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startCustomQuizSession(
      req.user?.id || null,
      getParam(req.params.quiz_id)
    );
    res.status(201).json(data);
  };

  listPlayedQuizzes = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listMyPlayedQuizzes(req.user!.id);
    res.status(200).json({ entries: data });
  };

  deleteQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.deleteQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  reportQuiz = async (req: Request, res: Response) => {
    const data = await this.quizReportService.reportQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };
}
