import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { type JwtPayload, type SignOptions, type Secret } from 'jsonwebtoken';

export type AuthContextUser = {
  id: string;
  email?: string;
  username?: string;
};

@Injectable()
export class AuthTokenService {
  signAccessToken(user: AuthContextUser) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
      },
      this.getJwtSecret(),
      this.getTokenOptions(process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m'),
    );
  }

  requireUserFromRequest(req: any): AuthContextUser {
    const header = String(req?.headers?.authorization || '').trim();
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new UnauthorizedException('Login required');
    return this.verifyAccessToken(token);
  }

  verifyAccessToken(token: string): AuthContextUser {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret(), {
        algorithms: ['HS256'],
        ...this.getIssuerAudience(),
      });
      if (typeof decoded === 'string' || !decoded?.sub) {
        throw new UnauthorizedException('Invalid token');
      }
      const payload = decoded as JwtPayload;
      return {
        id: String(payload.sub),
        email: payload.email ? String(payload.email) : undefined,
        username: payload.username ? String(payload.username) : undefined,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getJwtSecret(): Secret {
    const secret = String(process.env.JWT_SECRET || '').trim();
    if (!secret) throw new Error('Missing JWT_SECRET');
    return secret;
  }

  private getTokenOptions(expiresIn: string): SignOptions {
    return {
      expiresIn: expiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
      ...this.getIssuerAudience(),
    };
  }

  private getIssuerAudience() {
    const issuer = String(process.env.JWT_ISSUER || '').trim();
    const audience = String(process.env.JWT_AUDIENCE || '').trim();
    return {
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    };
  }
}
