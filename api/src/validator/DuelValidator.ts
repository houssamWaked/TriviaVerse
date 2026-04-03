import { body, param } from 'express-validator';

export const duelIdParam = [param('duel_id').isUUID().withMessage('duel_id must be a UUID')];

export const createDuelBody = [
  body('friend_user_id').isUUID().withMessage('friend_user_id must be a UUID'),
  body('mode').optional().isIn(['custom', 'blitz']).withMessage('mode must be custom or blitz'),
  body('quiz_id').optional().isUUID().withMessage('quiz_id must be a UUID'),
  body('difficulty')
    .optional({ nullable: true })
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('difficulty must be easy, medium, or hard')
    .custom((value, { req }) => {
      const mode = String(req.body?.mode || 'custom').trim().toLowerCase();
      if (mode !== 'blitz' && value != null) {
        throw new Error('difficulty is only supported for blitz duels');
      }
      return true;
    }),
  body('category_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('category_id must be a UUID')
    .custom((value, { req }) => {
      const mode = String(req.body?.mode || 'custom').trim().toLowerCase();
      if (mode !== 'blitz' && value != null) {
        throw new Error('category_id is only supported for blitz duels');
      }
      return true;
    }),
  body().custom((_, { req }) => {
    const mode = String(req.body?.mode || 'custom').trim().toLowerCase();
    if (mode === 'custom' && !req.body?.quiz_id) {
      throw new Error('quiz_id is required for custom duels');
    }
    if (mode === 'blitz' && req.body?.quiz_id) {
      throw new Error('quiz_id is not used for blitz duels');
    }
    return true;
  }),
];

export const duelLiveAnswerBody = [
  body('session_option_id').isUUID().withMessage('session_option_id must be a UUID'),
];
