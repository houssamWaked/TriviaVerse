/**
 * User domain entity.
 */
export type UserRecord = {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  avatar_url?: string | null;
  email_verified_at?: string | null;
  is_banned?: boolean | null;
  banned_reason?: string | null;
  banned_at?: string | null;
  created_at?: string | null;
};

export class User {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  avatar_url: string | null;
  email_verified_at: string | null;
  is_banned: boolean;
  banned_reason: string | null;
  banned_at: string | null;
  created_at: string | null;

  constructor({
    id,
    username,
    email,
    password_hash,
    avatar_url = null,
    email_verified_at = null,
    is_banned = false,
    banned_reason = null,
    banned_at = null,
    created_at = null,
  }: UserRecord) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
    this.avatar_url = avatar_url;
    this.email_verified_at = email_verified_at;
    this.is_banned = Boolean(is_banned);
    this.banned_reason = banned_reason;
    this.banned_at = banned_at;
    this.created_at = created_at;
  }
}
