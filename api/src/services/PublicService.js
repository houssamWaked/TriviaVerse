/**
 * Public service (unauthenticated endpoints).
 */
export class PublicService {
  constructor(gameSessionRepository, quizQuestionRepository, quizRepository) {
    this.gameSessionRepository = gameSessionRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.quizRepository = quizRepository;
  }

  async getHomeMetrics() {
    const [active_players, questions, quizzes_created] = await Promise.all([
      this.gameSessionRepository.countDistinctActivePlayers(),
      this.quizQuestionRepository.countAll(),
      this.quizRepository.countAll(),
    ]);

    return {
      active_players,
      questions,
      quizzes_created,
      fun_level: 100,
    };
  }
}

