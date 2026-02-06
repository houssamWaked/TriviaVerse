/**
 * Quiz discovery controller.
 */
export class QuizDiscoveryController {
  constructor(quizDiscoveryService) {
    this.quizDiscoveryService = quizDiscoveryService;
  }

  top = async (req, res) => {
    const data = await this.quizDiscoveryService.top({
      userId: req.user?.id || null,
      limit: req.query.limit,
    });
    res.status(200).json(data);
  };

  search = async (req, res) => {
    const data = await this.quizDiscoveryService.search({
      q: req.query.q,
      limit: req.query.limit,
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  getQuiz = async (req, res) => {
    const data = await this.quizDiscoveryService.getQuizDetails({
      quizId: req.params.quiz_id,
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  ratings = async (req, res) => {
    const data = await this.quizDiscoveryService.getRatingsSummary({
      quizId: req.params.quiz_id,
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  leaderboard = async (req, res) => {
    const data = await this.quizDiscoveryService.getCustomQuizLeaderboard({
      quizId: req.params.quiz_id,
      userId: req.user?.id || null,
      limit: req.query.limit,
    });
    res.status(200).json(data);
  };
}
