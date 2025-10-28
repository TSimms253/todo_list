import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  scheduleTasksEndpoint
} from '../controllers/task.controller.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateScheduleRequest,
  handleValidationErrors
} from '../middleware/validation.js';

const router = Router();

// Get all tasks
router.get('/', getAllTasks);

// Get task by ID
router.get('/:id', getTaskById);

// Create new task
router.post(
  '/',
  validateCreateTask,
  handleValidationErrors,
  createTask
);

// Update task
router.put(
  '/:id',
  validateUpdateTask,
  handleValidationErrors,
  updateTask
);

// Delete task
router.delete('/:id', deleteTask);

// Schedule tasks
router.post(
  '/schedule',
  validateScheduleRequest,
  handleValidationErrors,
  scheduleTasksEndpoint
);

export default router;
