/**
 * Quiz Question DTO returned to clients.
 */
export default class QuizQuestionDTO {
  constructor({
    id,
    quiz_id,
    question_text,
    explanation,
    time_limit_sec,
    points,
    order_index,
    options = [],
  }) {
    this.id = id;
    this.quiz_id = quiz_id;
    this.question_text = question_text;
    this.explanation = explanation;
    this.time_limit_sec = time_limit_sec;
    this.points = points;
    this.order_index = order_index;
    this.options = options;
  }

  static fromRow(row) {
    return new QuizQuestionDTO(row);
  }
}

