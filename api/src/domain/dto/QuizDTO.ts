/**
 * Quiz DTO returned to clients.
 */
type QuizRow = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  status: string;
  keywords?: string[] | null;
  created_at: string | null;
  published_at: string | null;
};

export default class QuizDTO {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: string;
  status: string;
  keywords: string[] | null;
  created_at: string | null;
  published_at: string | null;

  /**
   * Create a quiz DTO from a quiz row.
   * @param id Quiz id.
   * @param owner_user_id Owner user id.
   * @param title Quiz title.
   * @param description Optional description.
   * @param cover_image_url Optional cover image URL.
   * @param visibility Visibility (`public`/`private`/`unlisted`).
   * @param status Status (`draft`/`published`).
   * @param keywords Optional keyword tokens (if supported by schema).
   * @param created_at Created timestamp.
   * @param published_at Published timestamp.
   * @returns A `QuizDTO` instance.
   */
  constructor({
    id,
    owner_user_id,
    title,
    description,
    cover_image_url,
    visibility,
    status,
    keywords,
    created_at,
    published_at,
  }: QuizRow) {
    this.id = id;
    this.owner_user_id = owner_user_id;
    this.title = title;
    this.description = description;
    this.cover_image_url = cover_image_url;
    this.visibility = visibility;
    this.status = status;
    this.keywords = keywords ?? null;
    this.created_at = created_at;
    this.published_at = published_at;
  }

  /**
   * Convert a database row into a DTO.
   * @param row Quiz row.
   * @returns `QuizDTO`.
   */
  static fromRow(row: QuizRow): QuizDTO {
    return new QuizDTO(row);
  }
}
