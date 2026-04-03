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

export class PublicService {
  gameSessionRepository: GameSessionRepositoryLike;
  quizQuestionRepository: QuizQuestionRepositoryLike;
  quizRepository: QuizRepositoryLike;

  constructor(
    gameSessionRepository: GameSessionRepositoryLike,
    quizQuestionRepository: QuizQuestionRepositoryLike,
    quizRepository: QuizRepositoryLike
  ) {
    this.gameSessionRepository = gameSessionRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.quizRepository = quizRepository;
  }

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
