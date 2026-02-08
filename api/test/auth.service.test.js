import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import { AuthService } from '../src/services/AuthService.js';
import AppError from '../src/utils/AppError.js';

process.env.NODE_ENV = 'test';

test('AuthService.register requires email verification', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const user = {
    id: 'u1',
    username: 'user',
    email: 'user@example.com',
    password_hash: 'x',
    avatar_url: null,
    email_verified_at: null,
    created_at: null,
  };

  const userRepository = {
    findByEmail: async () => null,
    create: async () => user,
  };
  const userStatsRepository = { createDefault: async () => {} };

  const service = new AuthService(userRepository, userStatsRepository);
  const res = await service.register({
    username: 'user',
    email: 'user@example.com',
    password: 'password123',
  });

  assert.equal(res.needs_email_verification, true);
  assert.ok(res.verification_token);
  assert.equal(res.token, undefined);
});

test('AuthService.login blocks unverified users', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const password_hash = await bcrypt.hash('password123', 4);
  const user = {
    id: 'u1',
    username: 'user',
    email: 'user@example.com',
    password_hash,
    avatar_url: null,
    email_verified_at: null,
    created_at: null,
  };

  const userRepository = {
    findByEmail: async () => user,
  };
  const userStatsRepository = { createDefault: async () => {} };

  const service = new AuthService(userRepository, userStatsRepository);

  await assert.rejects(
    () => service.login({ email: 'user@example.com', password: 'password123' }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'EMAIL_NOT_VERIFIED');
      return true;
    }
  );
});

test('AuthService.verifyEmailToken marks user verified', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const password_hash = await bcrypt.hash('password123', 4);
  let storedUser = {
    id: 'u1',
    username: 'user',
    email: 'user@example.com',
    password_hash,
    avatar_url: null,
    email_verified_at: null,
    created_at: null,
  };

  const userRepository = {
    findByEmail: async () => storedUser,
    findById: async () => storedUser,
    markEmailVerified: async () => {
      storedUser = { ...storedUser, email_verified_at: new Date().toISOString() };
      return storedUser;
    },
  };
  const userStatsRepository = { createDefault: async () => {} };

  const service = new AuthService(userRepository, userStatsRepository);
  const resend = await service.resendVerification({ email: 'user@example.com' });
  assert.ok(resend.verification_token);

  const verified = await service.verifyEmailToken(resend.verification_token);
  assert.equal(verified.success, true);
  assert.ok(storedUser.email_verified_at);

  const login = await service.login({ email: 'user@example.com', password: 'password123' });
  assert.ok(login.token);
});
