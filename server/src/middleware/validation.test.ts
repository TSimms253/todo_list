import { describe, it, expect } from '@jest/globals';
import {
  validateCreateTask,
  validateUpdateTask,
  validateScheduleRequest
} from './validation.js';

describe('Validation Middleware', () => {
  describe('validateCreateTask', () => {
    it('should be an array of validation chains', () => {
      expect(Array.isArray(validateCreateTask)).toBe(true);
      expect(validateCreateTask.length).toBeGreaterThan(0);
    });

    it('should validate required title field', () => {
      const titleValidator = validateCreateTask.find(
        (chain: any) => chain.builder?.fields?.includes('title')
      );
      expect(titleValidator).toBeDefined();
    });

    it('should validate priority field', () => {
      const priorityValidator = validateCreateTask.find(
        (chain: any) => chain.builder?.fields?.includes('priority')
      );
      expect(priorityValidator).toBeDefined();
    });

    it('should validate optional dueDate field', () => {
      const dueDateValidator = validateCreateTask.find(
        (chain: any) => chain.builder?.fields?.includes('dueDate')
      );
      expect(dueDateValidator).toBeDefined();
    });

    it('should validate optional estimatedDuration field', () => {
      const durationValidator = validateCreateTask.find(
        (chain: any) => chain.builder?.fields?.includes('estimatedDuration')
      );
      expect(durationValidator).toBeDefined();
    });
  });

  describe('validateUpdateTask', () => {
    it('should be an array of validation chains', () => {
      expect(Array.isArray(validateUpdateTask)).toBe(true);
      expect(validateUpdateTask.length).toBeGreaterThan(0);
    });

    it('should validate optional title field', () => {
      const titleValidator = validateUpdateTask.find(
        (chain: any) => chain.builder?.fields?.includes('title')
      );
      expect(titleValidator).toBeDefined();
    });

    it('should validate optional status field', () => {
      const statusValidator = validateUpdateTask.find(
        (chain: any) => chain.builder?.fields?.includes('status')
      );
      expect(statusValidator).toBeDefined();
    });

    it('should validate optional scheduledStartTime field', () => {
      const startTimeValidator = validateUpdateTask.find(
        (chain: any) => chain.builder?.fields?.includes('scheduledStartTime')
      );
      expect(startTimeValidator).toBeDefined();
    });

    it('should validate optional scheduledEndTime field', () => {
      const endTimeValidator = validateUpdateTask.find(
        (chain: any) => chain.builder?.fields?.includes('scheduledEndTime')
      );
      expect(endTimeValidator).toBeDefined();
    });
  });

  describe('validateScheduleRequest', () => {
    it('should be an array of validation chains', () => {
      expect(Array.isArray(validateScheduleRequest)).toBe(true);
      expect(validateScheduleRequest.length).toBeGreaterThan(0);
    });

    it('should validate required taskIds field', () => {
      const taskIdsValidator = validateScheduleRequest.find(
        (chain: any) => chain.builder?.fields?.includes('taskIds')
      );
      expect(taskIdsValidator).toBeDefined();
    });

    it('should validate required startDate field', () => {
      const startDateValidator = validateScheduleRequest.find(
        (chain: any) => chain.builder?.fields?.includes('startDate')
      );
      expect(startDateValidator).toBeDefined();
    });

    it('should validate required endDate field', () => {
      const endDateValidator = validateScheduleRequest.find(
        (chain: any) => chain.builder?.fields?.includes('endDate')
      );
      expect(endDateValidator).toBeDefined();
    });

    it('should validate required workingHoursStart field', () => {
      const workingHoursStartValidator = validateScheduleRequest.find(
        (chain: any) => chain.builder?.fields?.includes('workingHoursStart')
      );
      expect(workingHoursStartValidator).toBeDefined();
    });

    it('should validate required workingHoursEnd field', () => {
      const workingHoursEndValidator = validateScheduleRequest.find(
        (chain: any) => chain.builder?.fields?.includes('workingHoursEnd')
      );
      expect(workingHoursEndValidator).toBeDefined();
    });
  });
});