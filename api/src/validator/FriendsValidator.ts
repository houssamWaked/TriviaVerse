import { body, param } from 'express-validator';

export const sendFriendRequestBody = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('username is required'),
];

export const requestIdParam = [
  param('request_id').isUUID().withMessage('request_id must be a uuid'),
];

export const friendUserIdParam = [
  param('friend_user_id').isUUID().withMessage('friend_user_id must be a uuid'),
];
