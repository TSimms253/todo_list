import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import router from './task.routes.js';
import { TaskPriority, TaskStatus } from '../types/task.types.js';

describe('Task Routes Integration', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tasks', router);
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const newTask = {
        title: 'Integration Test Task',
        description: 'Test Description',
        priority: TaskPriority.HIGH,
        estimatedDuration: 60
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'Integration Test Task',
          description: 'Test Description',
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
          estimatedDuration: 60
        })
      });
    });

    it('should reject task without title', async () => {
      const invalidTask = {
        description: 'No title',
        priority: TaskPriority.LOW
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject task with invalid priority', async () => {
      const invalidTask = {
        title: 'Invalid Priority',
        description: 'Test',
        priority: 'INVALID_PRIORITY'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject task with title exceeding 200 characters', async () => {
      const invalidTask = {
        title: 'a'.repeat(201),
        description: 'Test',
        priority: TaskPriority.LOW
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept task with optional dueDate', async () => {
      const taskWithDueDate = {
        title: 'Task with Due Date',
        description: 'Test',
        priority: TaskPriority.MEDIUM,
        dueDate: '2024-12-31T23:59:59Z',
        estimatedDuration: 90
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskWithDueDate)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dueDate).toBeDefined();
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task by ID', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task to Get',
          description: 'Test',
          priority: TaskPriority.LOW,
          estimatedDuration: 30
        });

      const taskId = createResponse.body.data.id;

      // Get the task
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: taskId,
          title: 'Task to Get'
        })
      });
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task with valid data', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task to Update',
          description: 'Original',
          priority: TaskPriority.LOW,
          estimatedDuration: 60
        });

      const taskId = createResponse.body.data.id;

      // Update the task
      const updateData = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: taskId,
          title: 'Updated Task',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.URGENT,
          description: 'Original'
        })
      });
    });

    it('should reject update with invalid status', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task for Invalid Update',
          description: 'Test',
          priority: TaskPriority.LOW,
          estimatedDuration: 60
        });

      const taskId = createResponse.body.data.id;

      // Try to update with invalid status
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent-id')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete existing task', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task to Delete',
          description: 'Test',
          priority: TaskPriority.LOW,
          estimatedDuration: 60
        });

      const taskId = createResponse.body.data.id;

      // Delete the task
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Task deleted successfully'
      });

      // Verify it's gone
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Task not found'
      });
    });
  });

  describe('POST /api/tasks/schedule', () => {
    it('should schedule tasks with valid request', async () => {
      // Create some tasks
      const task1 = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task 1',
          description: 'Test',
          priority: TaskPriority.HIGH,
          estimatedDuration: 60
        });

      const task2 = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task 2',
          description: 'Test',
          priority: TaskPriority.MEDIUM,
          estimatedDuration: 30
        });

      const task1Id = task1.body.data.id;
      const task2Id = task2.body.data.id;

      // Schedule them
      const scheduleRequest = {
        taskIds: [task1Id, task2Id],
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-15T23:59:59Z',
        workingHoursStart: 9,
        workingHoursEnd: 17
      };

      const response = await request(app)
        .post('/api/tasks/schedule')
        .send(scheduleRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: task1Id,
            scheduledStartTime: expect.any(String),
            scheduledEndTime: expect.any(String)
          })
        ])
      });
    });

    it('should reject schedule request with invalid taskIds', async () => {
      const response = await request(app)
        .post('/api/tasks/schedule')
        .send({
          taskIds: 'not-an-array',
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject schedule request with empty taskIds', async () => {
      const response = await request(app)
        .post('/api/tasks/schedule')
        .send({
          taskIds: [],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject schedule request with invalid working hours', async () => {
      const response = await request(app)
        .post('/api/tasks/schedule')
        .send({
          taskIds: ['task-1'],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 25,
          workingHoursEnd: 17
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for non-existent task IDs', async () => {
      const response = await request(app)
        .post('/api/tasks/schedule')
        .send({
          taskIds: ['non-existent-1', 'non-existent-2'],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
          workingHoursStart: 9,
          workingHoursEnd: 17
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Some task IDs do not exist'
      });
    });
  });
});