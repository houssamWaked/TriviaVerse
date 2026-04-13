import { adminApi } from './adminApi';
import { authApi } from './authApi';
import { gameplayApi } from './gameplayApi';
import { publicApi } from './publicApi';
import { quizApi } from './quizApi';
import { socialApi } from './socialApi';

/**
 * Unified API surface that composes the feature-specific API modules.
 *
 * Prefer importing specific modules (e.g. `publicApi`) for better tree-shaking,
 * but this is handy for legacy call sites.
 */
export const api = {
  ...publicApi,
  ...authApi,
  ...gameplayApi,
  ...quizApi,
  ...socialApi,
  ...adminApi,
};

