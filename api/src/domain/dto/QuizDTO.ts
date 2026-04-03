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

  static fromRow(row: QuizRow): QuizDTO {
    return new QuizDTO(row);
  }
}
