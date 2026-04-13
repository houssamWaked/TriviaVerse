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

  /**
   * Create a question option DTO from an option row.
   * @param id Option id.
   * @param question_id Parent question id.
   * @param option_text Option text.
   * @param is_correct Whether this option is the correct answer.
   * @param order_index Optional ordering index within the question.
   * @returns A `QuestionOptionDTO` instance.
   */
  constructor({ id, question_id, option_text, is_correct, order_index }: QuestionOptionRow) {
    this.id = id;
    this.question_id = question_id;
    this.option_text = option_text;
    this.is_correct = is_correct;
    this.order_index = order_index;
  }

  /**
   * Convert a database row into a DTO.
   * @param row Option row.
   * @returns `QuestionOptionDTO`.
   */
  static fromRow(row: QuestionOptionRow): QuestionOptionDTO {
    return new QuestionOptionDTO(row);
  }
}
