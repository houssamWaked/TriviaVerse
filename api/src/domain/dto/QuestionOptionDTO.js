/**
 * Question Option DTO returned to clients.
 */
export default class QuestionOptionDTO {
  constructor({ id, question_id, option_text, is_correct, order_index }) {
    this.id = id;
    this.question_id = question_id;
    this.option_text = option_text;
    this.is_correct = is_correct;
    this.order_index = order_index;
  }

  static fromRow(row) {
    return new QuestionOptionDTO(row);
  }
}

