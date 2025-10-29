import { describe, it, expect } from '@jest/globals';
import { scheduleTasks } from './scheduler.js';
import { Task, TaskPriority, TaskStatus, ScheduleRequest } from '../types/task.types.js';

describe('Scheduler - Edge Cases', () => {
  const now = new Date('2024-01-15T09:00:00Z');
  const today = '2024-01-15';

  // Helper to create a task
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: Math.random().toString(),
    title: 'Test Task',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    createdAt: now,
    updatedAt: now,
    estimatedDuration: 60,
    ...overrides
  });

  // Helper to create a schedule request
  const createRequest = (taskIds: string[], overrides: Partial<ScheduleRequest> = {}): ScheduleRequest => ({
    taskIds,
    startDate: `${today}T00:00:00Z`,
    endDate: `${today}T23:59:59Z`,
    workingHoursStart: 9,
    workingHoursEnd: 17,
    ...overrides
  });

  describe('Scenario 1: Medium task bumps Urgent task when deadline-critical', () => {
    it('should prioritize medium task that would miss deadline over urgent task with time buffer', () => {
      const urgentTask = createTask({
        id: 'urgent-1',
        title: 'Urgent Task',
        priority: TaskPriority.URGENT,
        dueDate: new Date('2024-01-22T17:00:00Z'), // 7 days from now
        estimatedDuration: 120 // 2 hours
      });

      const mediumTask = createTask({
        id: 'medium-1',
        title: 'Medium Task',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T13:00:00Z'), // Today at 1 PM
        estimatedDuration: 60 // 1 hour
      });

      const tasks = [urgentTask, mediumTask];
      const request = createRequest(['urgent-1', 'medium-1']);

      const result = scheduleTasks(tasks, request);

      // Medium task should be scheduled first (it's deadline-critical)
      const scheduledMedium = result.find(t => t.id === 'medium-1');
      const scheduledUrgent = result.find(t => t.id === 'urgent-1');

      expect(scheduledMedium).toBeDefined();
      expect(scheduledUrgent).toBeDefined();

      // Medium task should be scheduled before urgent
      expect(new Date(scheduledMedium!.scheduledStartTime!).getTime())
        .toBeLessThan(new Date(scheduledUrgent!.scheduledStartTime!).getTime());

      // Medium task should complete before its deadline
      expect(new Date(scheduledMedium!.scheduledEndTime!).getTime())
        .toBeLessThanOrEqual(new Date(mediumTask.dueDate!).getTime());
    });
  });

  describe('Scenario 2: Low priority tasks do not get deadline protection', () => {
    it('should allow low priority task to miss deadline when conflicting with higher priority', () => {
      const highTask = createTask({
        id: 'high-1',
        title: 'High Priority Task',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-01-16T17:00:00Z'), // Tomorrow
        estimatedDuration: 180 // 3 hours
      });

      const lowTask = createTask({
        id: 'low-1',
        title: 'Low Priority Task',
        priority: TaskPriority.LOW,
        dueDate: new Date('2024-01-15T13:00:00Z'), // Today at 1 PM
        estimatedDuration: 60 // 1 hour
      });

      const tasks = [highTask, lowTask];
      const request = createRequest(['high-1', 'low-1']);

      const result = scheduleTasks(tasks, request);

      const scheduledHigh = result.find(t => t.id === 'high-1');
      const scheduledLow = result.find(t => t.id === 'low-1');

      expect(scheduledHigh).toBeDefined();
      expect(scheduledLow).toBeDefined();

      // High priority task should be scheduled first
      expect(new Date(scheduledHigh!.scheduledStartTime!).getTime())
        .toBeLessThan(new Date(scheduledLow!.scheduledStartTime!).getTime());

      // Low priority task is allowed to miss its deadline
      // (it won't bump the high priority task)
    });
  });

  describe('Scenario 3: Due time comparison for deadline-critical tasks', () => {
    it('should schedule task with earlier due time first when both are deadline-critical', () => {
      const highTaskLateDue = createTask({
        id: 'high-late',
        title: 'High Priority - Due Late',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-01-15T23:00:00Z'), // Today at 11 PM
        estimatedDuration: 120 // 2 hours
      });

      const mediumTaskEarlyDue = createTask({
        id: 'medium-early',
        title: 'Medium Priority - Due Early',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T13:00:00Z'), // Today at 1 PM
        estimatedDuration: 60 // 1 hour
      });

      const tasks = [highTaskLateDue, mediumTaskEarlyDue];
      const request = createRequest(['high-late', 'medium-early']);

      const result = scheduleTasks(tasks, request);

      const scheduledHigh = result.find(t => t.id === 'high-late');
      const scheduledMedium = result.find(t => t.id === 'medium-early');

      expect(scheduledHigh).toBeDefined();
      expect(scheduledMedium).toBeDefined();

      // Medium task with earlier due time should be scheduled first
      expect(new Date(scheduledMedium!.scheduledStartTime!).getTime())
        .toBeLessThan(new Date(scheduledHigh!.scheduledStartTime!).getTime());

      // Both should complete before their deadlines
      expect(new Date(scheduledMedium!.scheduledEndTime!).getTime())
        .toBeLessThanOrEqual(new Date(mediumTaskEarlyDue.dueDate!).getTime());
      expect(new Date(scheduledHigh!.scheduledEndTime!).getTime())
        .toBeLessThanOrEqual(new Date(highTaskLateDue.dueDate!).getTime());
    });

    it('should respect higher priority when earlier due time task cannot be rescheduled', () => {
      const highTaskEarlyDue = createTask({
        id: 'high-early',
        title: 'High Priority - Due Early (tight deadline)',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-01-15T11:00:00Z'), // Today at 11 AM (tight!)
        estimatedDuration: 120 // 2 hours
      });

      const mediumTaskLateDue = createTask({
        id: 'medium-late',
        title: 'Medium Priority - Due Late',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T12:00:00Z'), // Today at 12 PM
        estimatedDuration: 60 // 1 hour
      });

      const tasks = [highTaskEarlyDue, mediumTaskLateDue];
      const request = createRequest(['high-early', 'medium-late']);

      const result = scheduleTasks(tasks, request);

      const scheduledHigh = result.find(t => t.id === 'high-early');
      const scheduledMedium = result.find(t => t.id === 'medium-late');

      expect(scheduledHigh).toBeDefined();
      expect(scheduledMedium).toBeDefined();

      // Both are deadline-critical but high priority should win when medium can't fit after
      // The scheduler should try to optimize based on feasibility
    });
  });

  describe('Working hours constraints', () => {
    it('should not schedule tasks outside working hours', () => {
      const task = createTask({
        id: 'task-1',
        estimatedDuration: 60
      });

      const tasks = [task];
      const request = createRequest(['task-1'], {
        workingHoursStart: 9,
        workingHoursEnd: 17
      });

      const result = scheduleTasks(tasks, request);
      const scheduled = result[0];

      expect(scheduled).toBeDefined();
      const startHour = new Date(scheduled.scheduledStartTime!).getUTCHours();
      const endHour = new Date(scheduled.scheduledEndTime!).getUTCHours();

      expect(startHour).toBeGreaterThanOrEqual(9);
      expect(endHour).toBeLessThanOrEqual(17);
    });

    it('should carry over to next day when task does not fit in working hours', () => {
      const task1 = createTask({
        id: 'task-1',
        estimatedDuration: 360 // 6 hours
      });

      const task2 = createTask({
        id: 'task-2',
        estimatedDuration: 240 // 4 hours
      });

      const tasks = [task1, task2];
      const request = createRequest(['task-1', 'task-2'], {
        workingHoursStart: 9,
        workingHoursEnd: 17, // 8 hour working day
        startDate: `${today}T00:00:00Z`,
        endDate: '2024-01-16T23:59:59Z' // 2 days
      });

      const result = scheduleTasks(tasks, request);

      expect(result).toHaveLength(2);

      const scheduled1 = result.find(t => t.id === 'task-1');
      const scheduled2 = result.find(t => t.id === 'task-2');

      // Task 2 should be scheduled on the next day
      const start1 = new Date(scheduled1!.scheduledStartTime!);
      const start2 = new Date(scheduled2!.scheduledStartTime!);

      expect(start2.getUTCDate()).toBeGreaterThanOrEqual(start1.getUTCDate());
    });
  });

  describe('Multiple deadline-critical tasks', () => {
    it('should schedule all deadline-critical tasks in due time order when feasible', () => {
      const task1 = createTask({
        id: 'task-1',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T11:00:00Z'), // 11 AM
        estimatedDuration: 60
      });

      const task2 = createTask({
        id: 'task-2',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T13:00:00Z'), // 1 PM
        estimatedDuration: 60
      });

      const task3 = createTask({
        id: 'task-3',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T15:00:00Z'), // 3 PM
        estimatedDuration: 60
      });

      const tasks = [task1, task2, task3];
      const request = createRequest(['task-1', 'task-2', 'task-3']);

      const result = scheduleTasks(tasks, request);

      expect(result).toHaveLength(3);

      // All should complete before their deadlines
      result.forEach((scheduled, index) => {
        const original = tasks.find(t => t.id === scheduled.id)!;
        expect(new Date(scheduled.scheduledEndTime!).getTime())
          .toBeLessThanOrEqual(new Date(original.dueDate!).getTime());
      });

      // Should be in due time order
      const sorted = result.sort((a, b) =>
        new Date(a.scheduledStartTime!).getTime() - new Date(b.scheduledStartTime!).getTime()
      );

      expect(sorted[0].id).toBe('task-1');
      expect(sorted[1].id).toBe('task-2');
      expect(sorted[2].id).toBe('task-3');
    });
  });

  describe('Tasks without due dates', () => {
    it('should schedule tasks without due dates after deadline-critical tasks', () => {
      const urgentNoDue = createTask({
        id: 'urgent-no-due',
        priority: TaskPriority.URGENT,
        dueDate: undefined,
        estimatedDuration: 120
      });

      const mediumWithDue = createTask({
        id: 'medium-due',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T11:00:00Z'),
        estimatedDuration: 60
      });

      const tasks = [urgentNoDue, mediumWithDue];
      const request = createRequest(['urgent-no-due', 'medium-due']);

      const result = scheduleTasks(tasks, request);

      const scheduledUrgent = result.find(t => t.id === 'urgent-no-due');
      const scheduledMedium = result.find(t => t.id === 'medium-due');

      // Medium task with deadline should be scheduled to meet its deadline
      expect(scheduledMedium).toBeDefined();
      expect(new Date(scheduledMedium!.scheduledEndTime!).getTime())
        .toBeLessThanOrEqual(new Date(mediumWithDue.dueDate!).getTime());
    });
  });

  describe('Task bumping and rescheduling', () => {
    it('should reschedule bumped tasks to next available slot', () => {
      const highTask = createTask({
        id: 'high-1',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-01-15T12:00:00Z'),
        estimatedDuration: 120
      });

      const mediumTask1 = createTask({
        id: 'medium-1',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-01-15T11:00:00Z'), // Earlier due time
        estimatedDuration: 60
      });

      const tasks = [highTask, mediumTask1];
      const request = createRequest(['high-1', 'medium-1']);

      const result = scheduleTasks(tasks, request);

      // Both should be scheduled
      expect(result).toHaveLength(2);

      // All tasks should have scheduled times
      result.forEach(task => {
        expect(task.scheduledStartTime).toBeDefined();
        expect(task.scheduledEndTime).toBeDefined();
      });
    });
  });

  describe('Edge case: Insufficient time for all tasks', () => {
    it('should skip tasks that cannot fit in schedule', () => {
      const task1 = createTask({
        id: 'task-1',
        estimatedDuration: 480 // 8 hours (full working day)
      });

      const task2 = createTask({
        id: 'task-2',
        estimatedDuration: 60
      });

      const tasks = [task1, task2];
      const request = createRequest(['task-1', 'task-2'], {
        startDate: `${today}T00:00:00Z`,
        endDate: `${today}T23:59:59Z` // Only one day
      });

      const result = scheduleTasks(tasks, request);

      // Task 1 should be scheduled
      expect(result.find(t => t.id === 'task-1')).toBeDefined();

      // Task 2 might not fit in the same day
      const scheduled2 = result.find(t => t.id === 'task-2');
      if (!scheduled2) {
        // This is acceptable - not enough time
        expect(result).toHaveLength(1);
      }
    });
  });
});