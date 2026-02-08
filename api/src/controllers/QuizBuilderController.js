/**
 * Quiz builder controller.
 */
export class QuizBuilderController {
  constructor(quizBuilderService, sessionStartService) {
    this.quizBuilderService = quizBuilderService;
    this.sessionStartService = sessionStartService;
  }

  listQuizzes = async (req, res) => {
    const data = await this.quizBuilderService.listQuizzes(req.user.id);
    res.status(200).json(data);
  };

  createQuiz = async (req, res) => {
    const data = await this.quizBuilderService.createQuiz(req.user.id, req.body);
    res.status(201).json(data);
  };

  getQuiz = async (req, res) => {
    const data = await this.quizBuilderService.getQuiz(req.user.id, req.params.quiz_id);
    res.status(200).json(data);
  };

  patchQuiz = async (req, res) => {
    const data = await this.quizBuilderService.patchQuiz(
      req.user.id,
      req.params.quiz_id,
      req.body
    );
    res.status(200).json(data);
  };

  publishQuiz = async (req, res) => {
    const data = await this.quizBuilderService.publishQuiz(req.user.id, req.params.quiz_id);
    res.status(200).json(data);
  };

  shareQuiz = async (req, res) => {
    const data = await this.quizBuilderService.shareQuiz(
      req.user.id,
      req.params.quiz_id,
      req.body.visibility
    );
    res.status(200).json(data);
  };

  listQuizQuestions = async (req, res) => {
    const data = await this.quizBuilderService.listQuizQuestions(
      req.user.id,
      req.params.quiz_id
    );
    res.status(200).json(data);
  };

  addQuizQuestion = async (req, res) => {
    const data = await this.quizBuilderService.addQuizQuestion(
      req.user.id,
      req.params.quiz_id,
      req.body
    );
    res.status(201).json(data);
  };

  patchQuizQuestion = async (req, res) => {
    const data = await this.quizBuilderService.patchQuizQuestion(
      req.user.id,
      req.params.question_id,
      req.body
    );
    res.status(200).json(data);
  };

  deleteQuizQuestion = async (req, res) => {
    await this.quizBuilderService.deleteQuizQuestion(req.user.id, req.params.question_id);
    res.status(204).send();
  };

  addQuestionOption = async (req, res) => {
    const data = await this.quizBuilderService.addQuestionOption(
      req.user.id,
      req.params.question_id,
      req.body
    );
    res.status(201).json(data);
  };

  patchQuestionOption = async (req, res) => {
    const data = await this.quizBuilderService.patchQuestionOption(
      req.user.id,
      req.params.option_id,
      req.body
    );
    res.status(200).json(data);
  };

  deleteQuestionOption = async (req, res) => {
    await this.quizBuilderService.deleteQuestionOption(req.user.id, req.params.option_id);
    res.status(204).send();
  };

  rateQuiz = async (req, res) => {
    const data = await this.quizBuilderService.rateQuiz(
      req.user.id,
      req.params.quiz_id,
      req.body.rating
    );
    res.status(200).json(data);
  };

  listQuizAccess = async (req, res) => {
    const data = await this.quizBuilderService.listQuizAccess(req.user.id, req.params.quiz_id);
    res.status(200).json(data);
  };

  addQuizAccess = async (req, res) => {
    const data = await this.quizBuilderService.addQuizAccess(req.user.id, req.params.quiz_id, req.body);
    res.status(201).json(data);
  };

  removeQuizAccess = async (req, res) => {
    const data = await this.quizBuilderService.removeQuizAccess(
      req.user.id,
      req.params.quiz_id,
      req.params.user_id
    );
    res.status(200).json(data);
  };

  startCustomSession = async (req, res) => {
    const data = await this.sessionStartService.startCustomQuizSession(
      req.user?.id || null,
      req.params.quiz_id
    );
    res.status(201).json(data);
  };

  listPlayedQuizzes = async (req, res) => {
    const data = await this.quizBuilderService.listMyPlayedQuizzes(req.user.id);
    res.status(200).json({ entries: data });
  };

  deleteQuiz = async (req, res) => {
    const data = await this.quizBuilderService.deleteQuiz(req.user.id, req.params.quiz_id);
    res.status(200).json(data);
  };
}
