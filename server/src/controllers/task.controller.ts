import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStatus,
  ScheduleRequest
} from '../types/task.types.js';
import { sanitizeObject } from '../utils/sanitize.js';
import { scheduleTasks } from '../utils/scheduler.js';

// In-memory storage (replace with database in production)
let tasks: Task[] = [];

/**
 * Get all tasks
 */
export function getAllTasks(req: Request, res: Response): void {
  res.json({
    success: true,
    data: tasks
  });
}

/**
 * Get task by ID
 */
export function getTaskById(req: Request, res: Response): void {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    res.status(404).json({
      success: false,
      message: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task
  });
}

/**
 * Create new task
 */
export function createTask(req: Request, res: Response): void {
  // Sanitize input to prevent XSS
  const sanitizedBody = sanitizeObject(req.body as CreateTaskDto);

  const newTask: Task = {
    id: uuidv4(),
    title: sanitizedBody.title,
    description: sanitizedBody.description,
    priority: sanitizedBody.priority,
    status: TaskStatus.TODO,
    dueDate: sanitizedBody.dueDate ? new Date(sanitizedBody.dueDate) : undefined,
    estimatedDuration: sanitizedBody.estimatedDuration,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  tasks.push(newTask);

  res.status(201).json({
    success: true,
    data: newTask
  });
}

/**
 * Update task
 */
export function updateTask(req: Request, res: Response): void {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({
      success: false,
      message: 'Task not found'
    });
    return;
  }

  // Sanitize input to prevent XSS
  const sanitizedBody = sanitizeObject(req.body as UpdateTaskDto);

  const updatedTask: Task = {
    ...tasks[taskIndex],
    ...sanitizedBody,
    dueDate: sanitizedBody.dueDate
      ? new Date(sanitizedBody.dueDate)
      : tasks[taskIndex].dueDate,
    scheduledStartTime: sanitizedBody.scheduledStartTime
      ? new Date(sanitizedBody.scheduledStartTime)
      : tasks[taskIndex].scheduledStartTime,
    scheduledEndTime: sanitizedBody.scheduledEndTime
      ? new Date(sanitizedBody.scheduledEndTime)
      : tasks[taskIndex].scheduledEndTime,
    updatedAt: new Date()
  };

  tasks[taskIndex] = updatedTask;

  res.json({
    success: true,
    data: updatedTask
  });
}

/**
 * Delete task
 */
export function deleteTask(req: Request, res: Response): void {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({
      success: false,
      message: 'Task not found'
    });
    return;
  }

  tasks.splice(taskIndex, 1);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}

/**
 * Schedule tasks based on priority
 */
export function scheduleTasksEndpoint(req: Request, res: Response): void {
  const scheduleRequest = req.body as ScheduleRequest;

  // Validate that all task IDs exist
  const requestedTasks = tasks.filter(t => scheduleRequest.taskIds.includes(t.id));

  if (requestedTasks.length !== scheduleRequest.taskIds.length) {
    res.status(400).json({
      success: false,
      message: 'Some task IDs do not exist'
    });
    return;
  }

  // Generate schedule
  const scheduledTasks = scheduleTasks(tasks, scheduleRequest);

  // Update tasks with scheduled times
  scheduledTasks.forEach(scheduledTask => {
    const taskIndex = tasks.findIndex(t => t.id === scheduledTask.id);
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        scheduledStartTime: scheduledTask.scheduledStartTime,
        scheduledEndTime: scheduledTask.scheduledEndTime,
        updatedAt: new Date()
      };
    }
  });

  res.json({
    success: true,
    data: scheduledTasks
  });
}
