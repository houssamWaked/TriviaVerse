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

  /**
   * Construct the quiz builder controller.
   * @param quizBuilderService Service for quiz CRUD and ownership checks.
   * @param sessionStartService Service for starting custom quiz sessions.
   * @param quizReportService Service for reporting quizzes.
   * @returns A `QuizBuilderController` instance.
   */
  constructor(
    quizBuilderService: QuizBuilderServiceLike,
    sessionStartService: SessionStartServiceLike,
    quizReportService: QuizReportServiceLike
  ) {
    this.quizBuilderService = quizBuilderService;
    this.sessionStartService = sessionStartService;
    this.quizReportService = quizReportService;
  }

  /**
   * List quizzes owned by the current user.
   * @param req Express request (expects `req.user`).
   * @param res Express response.
   * @returns A 200 response with quizzes.
   */
  listQuizzes = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizzes(req.user!.id);
    res.status(200).json(data);
  };

  /**
   * Create a new quiz for the current user.
   * @param req Express request (expects quiz payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created quiz.
   */
  createQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.createQuiz(req.user!.id, req.body);
    res.status(201).json(data);
  };

  /**
   * Fetch a quiz owned by the current user.
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with quiz details.
   */
  getQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.getQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  /**
   * Patch quiz metadata (owner-only).
   * @param req Express request (expects `:quiz_id` and patch payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with the updated quiz.
   */
  patchQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(200).json(data);
  };

  /**
   * Publish a quiz (owner-only).
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with the published quiz.
   */
  publishQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.publishQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  /**
   * List quiz questions (owner-only).
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with questions + options.
   */
  listQuizQuestions = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizQuestions(
      req.user!.id,
      getParam(req.params.quiz_id)
    );
    res.status(200).json(data);
  };

  /**
   * Add a question to a quiz (owner-only).
   * @param req Express request (expects `:quiz_id` and question payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created question.
   */
  addQuizQuestion = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuizQuestion(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };

  /**
   * Patch a quiz question (owner-only).
   * @param req Express request (expects `:question_id` and patch payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with the updated question.
   */
  patchQuizQuestion = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuizQuestion(
      req.user!.id,
      getParam(req.params.question_id),
      req.body
    );
    res.status(200).json(data);
  };

  /**
   * Add an option to a question (owner-only).
   * @param req Express request (expects `:question_id` and option payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created option.
   */
  addQuestionOption = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuestionOption(
      req.user!.id,
      getParam(req.params.question_id),
      req.body
    );
    res.status(201).json(data);
  };

  /**
   * Patch a question option (owner-only).
   * @param req Express request (expects `:option_id` and patch payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with the updated option.
   */
  patchQuestionOption = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.patchQuestionOption(
      req.user!.id,
      getParam(req.params.option_id),
      req.body
    );
    res.status(200).json(data);
  };

  /**
   * Rate a quiz as the current user.
   * @param req Express request (expects `:quiz_id` and `req.body.rating`).
   * @param res Express response.
   * @returns A 200 response with rating summary.
   */
  rateQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.rateQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body.rating
    );
    res.status(200).json(data);
  };

  /**
   * List explicit access rows for a quiz (owner-only).
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with access list.
   */
  listQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id)
    );
    res.status(200).json(data);
  };

  /**
   * Add a user to a quiz access allow-list (owner-only).
   * @param req Express request (expects `:quiz_id` and payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with added user summary.
   */
  addQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.addQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };

  /**
   * Remove a user from a quiz access allow-list (owner-only).
   * @param req Express request (expects `:quiz_id` and `:user_id`).
   * @param res Express response.
   * @returns A 200 response with success payload.
   */
  removeQuizAccess = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.removeQuizAccess(
      req.user!.id,
      getParam(req.params.quiz_id),
      getParam(req.params.user_id)
    );
    res.status(200).json(data);
  };

  /**
   * Start a playable custom quiz session for the current user (or guest).
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 201 response with session start payload.
   */
  startCustomSession = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startCustomQuizSession(
      req.user?.id || null,
      getParam(req.params.quiz_id)
    );
    res.status(201).json(data);
  };

  /**
   * List quizzes the current user has played (best-scores).
   * @param req Express request (expects `req.user`).
   * @param res Express response.
   * @returns A 200 response with `{ entries }`.
   */
  listPlayedQuizzes = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.listMyPlayedQuizzes(req.user!.id);
    res.status(200).json({ entries: data });
  };

  /**
   * Delete a quiz owned by the current user.
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with success payload.
   */
  deleteQuiz = async (req: Request, res: Response) => {
    const data = await this.quizBuilderService.deleteQuiz(req.user!.id, getParam(req.params.quiz_id));
    res.status(200).json(data);
  };

  /**
   * Report a published quiz as the current user.
   * @param req Express request (expects `:quiz_id` and payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with report result.
   */
  reportQuiz = async (req: Request, res: Response) => {
    const data = await this.quizReportService.reportQuiz(
      req.user!.id,
      getParam(req.params.quiz_id),
      req.body
    );
    res.status(201).json(data);
  };
}
