import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthTokenService } from './auth-token.service';

test('AuthTokenService signs and verifies an access token', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-for-nest-auth';

  try {
    const service = new AuthTokenService();
    const token = service.signAccessToken({
      id: 'user-1',
      email: 'player@example.com',
      username: 'player',
    });

    const decoded = service.verifyAccessToken(token);
    assert.equal(decoded.id, 'user-1');
    assert.equal(decoded.email, 'player@example.com');
    assert.equal(decoded.username, 'player');
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
