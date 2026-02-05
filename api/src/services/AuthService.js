/**
 * Auth service.
 *
 * This project uses a custom `users` table (not Supabase Auth).
 * Passwords are hashed with bcrypt and verified on login.
 */
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';
import { signAccessToken } from '../utils/jwt.js';

export class AuthService {
  constructor(userRepository, userStatsRepository) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
  }

  async register({ username, email, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409, 'DUPLICATE');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ username, email, password_hash });
    await this.userStatsRepository.createDefault(user.id);

    const token = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token };
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const token = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token };
  }
}

