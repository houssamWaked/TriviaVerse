/**
 * Category request validators.
 */
import { param } from 'express-validator';

export const idParam = [param('id').isUUID().withMessage('id must be a valid UUID')];
