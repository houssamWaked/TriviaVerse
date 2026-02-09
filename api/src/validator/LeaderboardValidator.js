/**
 * Leaderboard validators.
 */
import { query } from 'express-validator';

export const leaderboardQuery = [
  query('period')
    .optional()
    .isIn(['all_time', 'weekly'])
    .withMessage('period must be all_time or weekly'),
  query('mode')
    .optional()
    .isIn(['global', 'story', 'millionaire', 'classic', 'blitz', 'blitz_hard', 'custom'])
    .withMessage('mode is invalid'),
];
