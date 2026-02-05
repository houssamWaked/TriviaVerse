/**
 * Quiz DTO returned to clients.
 */
export default class QuizDTO {
  constructor({
    id,
    owner_user_id,
    title,
    description,
    cover_image_url,
    visibility,
    status,
    created_at,
    published_at,
  }) {
    this.id = id;
    this.owner_user_id = owner_user_id;
    this.title = title;
    this.description = description;
    this.cover_image_url = cover_image_url;
    this.visibility = visibility;
    this.status = status;
    this.created_at = created_at;
    this.published_at = published_at;
  }

  static fromRow(row) {
    return new QuizDTO(row);
  }
}

