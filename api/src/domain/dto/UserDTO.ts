/**
 * User DTO returned to clients (never includes password_hash).
 */
import type { UserRecord } from '../entity/User.js';

type UserDtoSource = Pick<
  UserRecord,
  'id' | 'username' | 'email' | 'avatar_url' | 'email_verified_at'
>;

export default class UserDTO {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  email_verified: boolean;

  constructor({ id, username, email, avatar_url = null, email_verified_at = null }: UserDtoSource) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatar_url = avatar_url;
    this.email_verified = Boolean(email_verified_at);
  }

  static fromEntity(entity: UserDtoSource): UserDTO {
    return new UserDTO(entity);
  }
}
