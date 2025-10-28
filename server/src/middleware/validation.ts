import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { TaskPriority, TaskStatus } from '../types/task.types.js';

/**
 * Validation middleware for create task endpoint
 */
export const validateCreateTask: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('priority')
    .isIn(Object.values(TaskPriority))
    .withMessage('Invalid priority value'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes')
];

/**
 * Validation middleware for update task endpoint
 */
export const validateUpdateTask: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage('Invalid priority value'),
  body('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage('Invalid status value'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Estimated duration must be between 1 and 1440 minutes'),
  body('scheduledStartTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('scheduledEndTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

/**
 * Validation middleware for schedule request
 */
export const validateScheduleRequest: ValidationChain[] = [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('Task IDs must be a non-empty array'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('workingHoursStart')
    .isInt({ min: 0, max: 23 })
    .withMessage('Working hours start must be between 0 and 23'),
  body('workingHoursEnd')
    .isInt({ min: 1, max: 24 })
    .withMessage('Working hours end must be between 1 and 24')
];

/**
 * Middleware to handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array()
    });
    return;
  }

  next();
}
