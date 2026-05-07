import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokens: AuthTokenService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const { data, error } = await this.db.supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url, email_verified_at, is_banned')
      .eq('email', normalizedEmail)
      .limit(1);

    if (error) throw new UnauthorizedException('Invalid email or password');
    const user = data?.[0] as any;
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(String(password || ''), String(user.password_hash || ''));
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    if (user.is_banned) throw new UnauthorizedException('Account banned');
    if (!user.email_verified_at) throw new UnauthorizedException('Email not verified');

    const safeUser = this.toSafeUser(user);
    return {
      user: safeUser,
      token: this.tokens.signAccessToken(safeUser),
    };
  }

  async findMe(req: any) {
    const authUser = this.tokens.requireUserFromRequest(req);
    const { data, error } = await this.db.supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', authUser.id)
      .limit(1);

    if (error || !data?.[0]) throw new UnauthorizedException('User not found');
    return this.toSafeUser(data[0]);
  }

  private toSafeUser(user: any) {
    return {
      id: String(user.id),
      username: String(user.username || ''),
      email: String(user.email || ''),
      avatar_url: user.avatar_url ?? null,
    };
  }
}
