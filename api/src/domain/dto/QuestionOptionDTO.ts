/**
 * Question Option DTO returned to clients.
 */
type QuestionOptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number | null;
};

export default class QuestionOptionDTO {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number | null;

  constructor({ id, question_id, option_text, is_correct, order_index }: QuestionOptionRow) {
    this.id = id;
    this.question_id = question_id;
    this.option_text = option_text;
    this.is_correct = is_correct;
    this.order_index = order_index;
  }

  static fromRow(row: QuestionOptionRow): QuestionOptionDTO {
    return new QuestionOptionDTO(row);
  }
}
