/**
 * Public service (unauthenticated endpoints).
 */
type GameSessionRepositoryLike = {
  countDistinctActivePlayers(): Promise<number>;
};

type QuizQuestionRepositoryLike = {
  countAll(): Promise<number>;
};

type QuizRepositoryLike = {
  countAll(): Promise<number>;
};

type HomeMetrics = {
  active_players: number;
  questions: number;
  quizzes_created: number;
  fun_level: number;
};

// Domain service for unauthenticated read-only endpoints.
export class PublicService {
  gameSessionRepository: GameSessionRepositoryLike;
  quizQuestionRepository: QuizQuestionRepositoryLike;
  quizRepository: QuizRepositoryLike;

  /**
   * Construct the public service.
   * @param gameSessionRepository Repository for game sessions (active players).
   * @param quizQuestionRepository Repository for total question counts.
   * @param quizRepository Repository for total quiz counts.
   * @returns A `PublicService` instance.
   */
  constructor(
    gameSessionRepository: GameSessionRepositoryLike,
    quizQuestionRepository: QuizQuestionRepositoryLike,
    quizRepository: QuizRepositoryLike
  ) {
    this.gameSessionRepository = gameSessionRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.quizRepository = quizRepository;
  }

  /**
   * Build home-page metrics by aggregating counts from repositories.
   * @returns Metric snapshot used by the client home screen.
   */
  async getHomeMetrics(): Promise<HomeMetrics> {
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
