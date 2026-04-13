/**
 * Quiz Question DTO returned to clients.
 */
type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  time_limit_sec: number | null;
  points: number | null;
  order_index: number | null;
  options?: unknown[];
};

export default class QuizQuestionDTO {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  time_limit_sec: number | null;
  points: number | null;
  order_index: number | null;
  options: unknown[];

  /**
   * Create a quiz question DTO from a question row.
   * @param id Question id.
   * @param quiz_id Parent quiz id.
   * @param question_text Question prompt.
   * @param explanation Optional explanation text.
   * @param time_limit_sec Optional time limit (seconds).
   * @param points Optional point value.
   * @param order_index Optional ordering index within the quiz.
   * @param options Attached option DTOs/rows.
   * @returns A `QuizQuestionDTO` instance.
   */
  constructor({
    id,
    quiz_id,
    question_text,
    explanation,
    time_limit_sec,
    points,
    order_index,
    options = [],
  }: QuizQuestionRow) {
    this.id = id;
    this.quiz_id = quiz_id;
    this.question_text = question_text;
    this.explanation = explanation;
    this.time_limit_sec = time_limit_sec;
    this.points = points;
    this.order_index = order_index;
    this.options = options;
  }

  /**
   * Convert a database row into a DTO.
   * @param row Quiz question row.
   * @returns `QuizQuestionDTO`.
   */
  static fromRow(row: QuizQuestionRow): QuizQuestionDTO {
    return new QuizQuestionDTO(row);
  }
}
