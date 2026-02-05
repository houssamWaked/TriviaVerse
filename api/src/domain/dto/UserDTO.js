/**
 * User DTO returned to clients (never includes password_hash).
 */
export default class UserDTO {
  constructor({ id, username, email, avatar_url = null }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatar_url = avatar_url;
  }

  static fromEntity(entity) {
    return new UserDTO(entity);
  }
}

