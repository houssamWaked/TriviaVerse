/**
 * User domain entity.
 */
export class User {
  constructor({
    id,
    username,
    email,
    password_hash,
    avatar_url = null,
    email_verified_at = null,
    created_at = null,
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
    this.avatar_url = avatar_url;
    this.email_verified_at = email_verified_at;
    this.created_at = created_at;
  }
}
