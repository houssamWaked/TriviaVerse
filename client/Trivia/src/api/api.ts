import { adminApi } from './adminApi';
import { authApi } from './authApi';
import { gameplayApi } from './gameplayApi';
import { publicApi } from './publicApi';
import { quizApi } from './quizApi';
import { socialApi } from './socialApi';

export const api = {
  ...publicApi,
  ...authApi,
  ...gameplayApi,
  ...quizApi,
  ...socialApi,
  ...adminApi,
};

