import { body, param } from 'express-validator';

export const duelIdParam = [param('duel_id').isUUID().withMessage('duel_id must be a UUID')];

export const createDuelBody = [
  body('friend_user_id').isUUID().withMessage('friend_user_id must be a UUID'),
  body('quiz_id').isUUID().withMessage('quiz_id must be a UUID'),
];

export const duelLiveAnswerBody = [
  body('session_option_id').isUUID().withMessage('session_option_id must be a UUID'),
];
