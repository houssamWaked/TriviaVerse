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

  static fromRow(row: QuizQuestionRow): QuizQuestionDTO {
    return new QuizQuestionDTO(row);
  }
}
