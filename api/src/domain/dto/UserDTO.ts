/**
 * User DTO returned to clients (never includes password_hash).
 */
import type { UserRecord } from '../entity/User.js';

type UserDtoSource = Pick<
  UserRecord,
  'id' | 'username' | 'email' | 'avatar_url' | 'email_verified_at'
>;

// Client-facing user shape (intentionally omits sensitive fields like password hash).
export default class UserDTO {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  email_verified: boolean;

  /**
   * Create a user DTO.
   * @param source User fields safe to return to clients.
   * @returns A `UserDTO` instance.
   */
  constructor({ id, username, email, avatar_url = null, email_verified_at = null }: UserDtoSource) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatar_url = avatar_url;
    this.email_verified = Boolean(email_verified_at);
  }

  /**
   * Convert a user entity/row into a DTO.
   * @param entity User-like source.
   * @returns A `UserDTO`.
   */
  static fromEntity(entity: UserDtoSource): UserDTO {
    return new UserDTO(entity);
  }
}
