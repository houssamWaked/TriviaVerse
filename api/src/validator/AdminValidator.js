import { body, param, query } from 'express-validator';

export const createStoryLevelBody = [
  body('level_number').optional().isInt({ min: 1, max: 1000 }),
  body('title').isString().trim().isLength({ min: 3, max: 80 }),
  body('difficulty_min').optional().isInt({ min: 1, max: 10 }),
  body('difficulty_max').optional().isInt({ min: 1, max: 10 }),
  body('pass_score_min').optional().isInt({ min: 0, max: 1000000 }),
  body('xp_reward').optional().isInt({ min: 0, max: 1000000 }),
];

export const createClassicCategoryLevelBody = [
  body('level_number').optional().isInt({ min: 1, max: 1000 }),
  body('title').isString().trim().isLength({ min: 1, max: 80 }),
  body('difficulty_min').optional().isInt({ min: 1, max: 10 }),
  body('difficulty_max').optional().isInt({ min: 1, max: 10 }),
  body('xp_reward').optional().isInt({ min: 0, max: 1000000 }),
];

export const levelIdParam = [param('level_id').isUUID().withMessage('level_id must be a uuid')];

export const categoryIdParam = [
  param('category_id').isUUID().withMessage('category_id must be a uuid'),
];

export const questionIdParam = [
  param('question_id').isUUID().withMessage('question_id must be a uuid'),
];

export const reportIdParam = [param('report_id').isUUID().withMessage('report_id must be a uuid')];

export const quizIdParam = [param('quiz_id').isUUID().withMessage('quiz_id must be a uuid')];

export const userIdParam = [param('user_id').isUUID().withMessage('user_id must be a uuid')];

export const listReportsQuery = [
  query('status').optional().isIn(['open', 'resolved']),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0, max: 100000 }),
];

export const banUserBody = [
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 400 }),
];

export const seedPoolBody = [body('random_count').optional().isInt({ min: 1, max: 50 })];

export const addPoolBody = [
  body('question_ids').isArray({ min: 1, max: 50 }),
  body('question_ids.*').isUUID().withMessage('question_ids must be uuid[]'),
];

export const createGlobalQuestionBody = [
  body('question_text').isString().trim().isLength({ min: 5, max: 300 }),
  body('difficulty_rating').optional().isInt({ min: 1, max: 10 }),
  body('explanation').isString().trim().isLength({ min: 1, max: 2000 }),
  body('time_limit_sec').optional().isInt({ min: 3, max: 600 }),
  body('points').optional().isInt({ min: 0, max: 100000 }),
  body('options').isArray({ min: 2, max: 6 }),
  body('options.*.option_text').isString().trim().isLength({ min: 1, max: 300 }),
  body('options.*.is_correct').optional().isBoolean(),
  body('modes').optional().isArray({ max: 1 }),
];

export const patchGlobalQuestionBody = [
  body('question_text').optional().isString().trim().isLength({ min: 5, max: 300 }),
  body('difficulty_rating').optional().isInt({ min: 1, max: 10 }),
  body('explanation')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 }),
  body('time_limit_sec').optional().isInt({ min: 3, max: 600 }),
  body('points').optional().isInt({ min: 0, max: 100000 }),
];

export const replaceGlobalQuestionOptionsBody = [
  body('options').isArray({ min: 2, max: 6 }),
  body('options.*.option_text').isString().trim().isLength({ min: 1, max: 300 }),
  body('options.*.is_correct').optional().isBoolean(),
];

export const createClassicCategoryBody = [
  body('name').isString().trim().isLength({ min: 2, max: 40 }),
  body('icon').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
];

export const listQuestionsQuery = [
  query('q').optional().isString().trim().isLength({ min: 0, max: 200 }),
  query('assigned').optional().isIn(['all', 'assigned', 'unassigned']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('offset').optional().isInt({ min: 0, max: 100000 }),
];

export const modeParam = [
  param('mode')
    .isString()
    .trim()
    .isIn(['classic', 'blitz', 'millionaire'])
    .withMessage('mode must be classic|blitz|millionaire'),
];

export const listPoolQuery = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0, max: 100000 }),
];

export const replacePoolBody = [
  body('question_ids').isArray({ min: 0, max: 200 }),
  body('question_ids.*').isUUID().withMessage('question_ids must be uuid[]'),
];
