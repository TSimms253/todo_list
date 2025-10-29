import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  scheduleTasksEndpoint
} from './task.controller.js';
import { Task, TaskPriority, TaskStatus } from '../types/task.types.js';

// Mock the utilities
jest.mock('../utils/sanitize.js', () => ({
  sanitizeObject: jest.fn((obj: any) => obj)
}));

jest.mock('../utils/scheduler.js', () => ({
  scheduleTasks: jest.fn((tasks: any, request: any) => {
    // Return mock scheduled tasks
    return request.taskIds.map((id: string) => {
      const task = (tasks as Task[]).find((t: Task) => t.id === id);
      return {
        ...task,
        scheduledStartTime: new Date('2024-01-15T09:00:00Z'),
        scheduledEndTime: new Date('2024-01-15T10:00:00Z')
      };
    });
  })
}));

// Helper to create mock Request and Response
function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides
  } as Partial<Request>;
}

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis() as any,
    json: jest.fn().mockReturnThis() as any
  };
  return res;
}

describe('Task Controller', () => {

  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      const req = createMockReq();
      const res = createMockRes();

      getAllTasks(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', () => {
      const req = createMockReq();
      const res = createMockRes();

      // First create a task
      const createReq = createMockReq({
        body: {
          title: 'Test Task',
          description: 'Test Description',
          priority: TaskPriority.HIGH,
          estimatedDuration: 60
        }
      });
      const createRes = createMockRes();
      createTask(createReq as Request, createRes as Response);

      // Extract the created task ID
      const createCall = (createRes.json as jest.Mock).mock.calls[0][0] as any;
      const taskId = createCall.data.id as string;

      // Now get it by ID
      req.params = { id: taskId };
      getTaskById(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: taskId,
          title: 'Test Task'
        })
      });
    });

    it('should return 404 when task not found', () => {
      const req = createMockReq({
        params: { id: 'non-existent-id' }
      });
      const res = createMockRes();

      getTaskById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('createTask', () => {
    it('should create a new task with all fields', () => {
      const req = createMockReq({
        body: {
          title: 'New Task',
          description: 'Task Description',
          priority: TaskPriority.HIGH,
          dueDate: '2024-12-31T23:59:59Z',
          estimatedDuration: 120
        }
      });
      const res = createMockRes();

      createTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'New Task',
          description: 'Task Description',
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
          estimatedDuration: 120,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should create task without optional fields', () => {
      const req = createMockReq({
        body: {
          title: 'Minimal Task',
          description: '',
          priority: TaskPriority.LOW
        }
      });
      const res = createMockRes();

      createTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          title: 'Minimal Task',
          priority: TaskPriority.LOW,
          status: TaskStatus.TODO
        })
      });
    });
  });

  describe('updateTask', () => {
    it('should update existing task', () => {
      // Create a task first
      const createReq = createMockReq({
        body: {
          title: 'Original Title',
          description: 'Original Description',
          priority: TaskPriority.LOW,
          estimatedDuration: 60
        }
      });
      const createRes = createMockRes();
      createTask(createReq as Request, createRes as Response);

      const taskId = ((createRes.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      // Update the task
      const updateReq = createMockReq({
        params: { id: taskId },
        body: {
          title: 'Updated Title',
          priority: TaskPriority.URGENT,
          status: TaskStatus.IN_PROGRESS
        }
      });
      const updateRes = createMockRes();

      updateTask(updateReq as Request, updateRes as Response);

      expect(updateRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: taskId,
          title: 'Updated Title',
          priority: TaskPriority.URGENT,
          status: TaskStatus.IN_PROGRESS,
          description: 'Original Description'
        })
      });
    });

    it('should update task with date fields', () => {
      // Create a task first
      const createReq = createMockReq({
        body: {
          title: 'Task with Dates',
          description: '',
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 60
        }
      });
      const createRes = createMockRes();
      createTask(createReq as Request, createRes as Response);

      const taskId = ((createRes.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      // Update with dates
      const updateReq = createMockReq({
        params: { id: taskId },
        body: {
          dueDate: '2024-12-31T23:59:59Z',
          scheduledStartTime: '2024-01-15T09:00:00Z',
          scheduledEndTime: '2024-01-15T10:00:00Z'
        }
      });
      const updateRes = createMockRes();

      updateTask(updateReq as Request, updateRes as Response);

      expect(updateRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: taskId,
          dueDate: expect.any(Date),
          scheduledStartTime: expect.any(Date),
          scheduledEndTime: expect.any(Date)
        })
      });
    });

    it('should return 404 when task not found', () => {
      const req = createMockReq({
        params: { id: 'non-existent-id' },
        body: { title: 'Updated Title' }
      });
      const res = createMockRes();

      updateTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', () => {
      // Create a task first
      const createReq = createMockReq({
        body: {
          title: 'Task to Delete',
          description: '',
          priority: TaskPriority.LOW,
          estimatedDuration: 60
        }
      });
      const createRes = createMockRes();
      createTask(createReq as Request, createRes as Response);

      const taskId = ((createRes.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      // Delete the task
      const deleteReq = createMockReq({
        params: { id: taskId }
      });
      const deleteRes = createMockRes();

      deleteTask(deleteReq as Request, deleteRes as Response);

      expect(deleteRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully'
      });

      // Verify task is gone
      const getReq = createMockReq({
        params: { id: taskId }
      });
      const getRes = createMockRes();
      getTaskById(getReq as Request, getRes as Response);

      expect(getRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when task not found', () => {
      const req = createMockReq({
        params: { id: 'non-existent-id' }
      });
      const res = createMockRes();

      deleteTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('scheduleTasksEndpoint', () => {
    it('should schedule tasks successfully', () => {
      // Create some tasks
      const task1Req = createMockReq({
        body: {
          title: 'Task 1',
          description: '',
          priority: TaskPriority.HIGH,
          estimatedDuration: 60
        }
      });
      const task1Res = createMockRes();
      createTask(task1Req as Request, task1Res as Response);
      const task1Id = ((task1Res.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      const task2Req = createMockReq({
        body: {
          title: 'Task 2',
          description: '',
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 30
        }
      });
      const task2Res = createMockRes();
      createTask(task2Req as Request, task2Res as Response);
      const task2Id = ((task2Res.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      // Schedule them
      const scheduleReq = createMockReq({
        body: {
          taskIds: [task1Id, task2Id],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        }
      });
      const scheduleRes = createMockRes();

      scheduleTasksEndpoint(scheduleReq as Request, scheduleRes as Response);

      expect(scheduleRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: task1Id,
            scheduledStartTime: expect.any(Date),
            scheduledEndTime: expect.any(Date)
          }),
          expect.objectContaining({
            id: task2Id,
            scheduledStartTime: expect.any(Date),
            scheduledEndTime: expect.any(Date)
          })
        ])
      });
    });

    it('should return 400 when task IDs do not exist', () => {
      const req = createMockReq({
        body: {
          taskIds: ['non-existent-1', 'non-existent-2'],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        }
      });
      const res = createMockRes();

      scheduleTasksEndpoint(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Some task IDs do not exist'
      });
    });

    it('should return 400 when some task IDs do not exist', () => {
      // Create one task
      const createReq = createMockReq({
        body: {
          title: 'Valid Task',
          description: '',
          priority: TaskPriority.HIGH,
          estimatedDuration: 60
        }
      });
      const createRes = createMockRes();
      createTask(createReq as Request, createRes as Response);
      const validId = ((createRes.json as jest.Mock).mock.calls[0][0] as any).data.id as string;

      // Try to schedule with one valid and one invalid ID
      const req = createMockReq({
        body: {
          taskIds: [validId, 'non-existent-id'],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        }
      });
      const res = createMockRes();

      scheduleTasksEndpoint(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Some task IDs do not exist'
      });
    });
  });
});