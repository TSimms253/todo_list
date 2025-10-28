import { Task, TaskPriority, ScheduledTask, ScheduleRequest } from '../types/task.types.js';

/**
 * Priority weights for scheduling algorithm
 */
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  [TaskPriority.URGENT]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1
};

/**
 * Calculates urgency score based on due date proximity
 */
function calculateUrgencyScore(dueDate: Date | undefined, now: Date): number {
  if (!dueDate) return 0;

  const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) return 10; // Overdue
  if (daysUntilDue < 1) return 8; // Due today
  if (daysUntilDue < 3) return 6; // Due in 2-3 days
  if (daysUntilDue < 7) return 4; // Due this week
  if (daysUntilDue < 14) return 2; // Due in 2 weeks
  return 1; // Due later
}

/**
 * Calculates overall task score for scheduling priority
 */
function calculateTaskScore(task: Task, now: Date): number {
  const priorityScore = PRIORITY_WEIGHTS[task.priority];
  const urgencyScore = calculateUrgencyScore(task.dueDate, now);

  // Combined score: priority weight * 10 + urgency score
  return priorityScore * 10 + urgencyScore;
}

/**
 * Represents a time slot with a scheduled task
 */
interface TimeSlot {
  startTime: Date;
  endTime: Date;
  task: Task;
  score: number;
}

/**
 * Checks if two time ranges overlap
 */
function timeSlotsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Finds the next available time slot after a given time
 */
function findNextAvailableSlot(
  startTime: Date,
  duration: number,
  existingSlots: TimeSlot[],
  workingHoursStart: number,
  workingHoursEnd: number,
  endDate: Date
): Date | null {
  let currentTime = new Date(startTime);

  // Ensure we start at or after working hours
  if (currentTime.getHours() < workingHoursStart) {
    currentTime.setHours(workingHoursStart, 0, 0, 0);
  }

  while (currentTime <= endDate) {
    const proposedEndTime = new Date(currentTime.getTime() + duration * 60000);
    const endHour = proposedEndTime.getHours() + proposedEndTime.getMinutes() / 60;

    // Check if we exceed working hours
    if (endHour > workingHoursEnd) {
      // Move to next day
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    // Check for conflicts with existing slots
    const hasConflict = existingSlots.some(slot =>
      timeSlotsOverlap(currentTime, proposedEndTime, slot.startTime, slot.endTime)
    );

    if (!hasConflict) {
      return currentTime;
    }

    // Find the earliest conflicting slot and move past it
    const conflictingSlots = existingSlots.filter(slot =>
      timeSlotsOverlap(currentTime, proposedEndTime, slot.startTime, slot.endTime)
    );

    if (conflictingSlots.length > 0) {
      const latestEndTime = conflictingSlots.reduce(
        (latest, slot) => (slot.endTime > latest ? slot.endTime : latest),
        new Date(0)
      );
      currentTime = new Date(latestEndTime);
    } else {
      currentTime = new Date(currentTime.getTime() + 15 * 60000); // Move 15 minutes forward
    }
  }

  return null; // No available slot found
}

/**
 * Schedules tasks based on priority and due dates, considering existing scheduled tasks
 */
export function scheduleTasks(
  tasks: Task[],
  request: ScheduleRequest
): ScheduledTask[] {
  const now = new Date();
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);

  // Get tasks to schedule
  const tasksToSchedule = tasks.filter(task => request.taskIds.includes(task.id));

  // Get existing scheduled tasks (not in the current schedule request)
  const existingScheduledTasks = tasks.filter(
    task =>
      !request.taskIds.includes(task.id) &&
      task.scheduledStartTime &&
      task.scheduledEndTime
  );

  // Calculate scores for all tasks
  const tasksWithScores = tasksToSchedule.map(task => ({
    task,
    score: calculateTaskScore(task, now)
  }));

  // Sort by score (higher = higher priority)
  const sortedTasksToSchedule = tasksWithScores
    .sort((a, b) => b.score - a.score)
    .map(({ task, score }) => ({ task, score }));

  // Build initial time slots from existing scheduled tasks
  const timeSlots: TimeSlot[] = existingScheduledTasks.map(task => ({
    startTime: new Date(task.scheduledStartTime!),
    endTime: new Date(task.scheduledEndTime!),
    task,
    score: calculateTaskScore(task, now)
  }));

  const scheduledTasks: ScheduledTask[] = [];
  const tasksToReschedule: Task[] = [];

  // Schedule each task
  for (const { task, score } of sortedTasksToSchedule) {
    const duration = task.estimatedDuration || 60; // Default 60 minutes

    // Find next available slot
    const availableTime = findNextAvailableSlot(
      startDate,
      duration,
      timeSlots,
      request.workingHoursStart,
      request.workingHoursEnd,
      endDate
    );

    if (!availableTime) {
      continue; // Skip if no slot available
    }

    const scheduledStartTime = availableTime;
    const scheduledEndTime = new Date(availableTime.getTime() + duration * 60000);

    // Check if this higher priority task should bump any lower priority tasks
    const conflictingSlots = timeSlots.filter(slot =>
      timeSlotsOverlap(scheduledStartTime, scheduledEndTime, slot.startTime, slot.endTime)
    );

    const lowerPriorityConflicts = conflictingSlots.filter(slot => slot.score < score);

    if (lowerPriorityConflicts.length > 0) {
      // Remove lower priority tasks from time slots and mark for rescheduling
      lowerPriorityConflicts.forEach(slot => {
        const index = timeSlots.indexOf(slot);
        if (index > -1) {
          timeSlots.splice(index, 1);
          tasksToReschedule.push(slot.task);
        }
      });
    }

    // Add this task to scheduled tasks
    scheduledTasks.push({
      ...task,
      scheduledStartTime,
      scheduledEndTime
    });

    // Add to time slots
    timeSlots.push({
      startTime: scheduledStartTime,
      endTime: scheduledEndTime,
      task,
      score
    });
  }

  // Reschedule bumped tasks
  const rescheduledTasks = tasksToReschedule.map(task => {
    const duration = task.estimatedDuration || 60;
    const score = calculateTaskScore(task, now);

    const availableTime = findNextAvailableSlot(
      startDate,
      duration,
      timeSlots,
      request.workingHoursStart,
      request.workingHoursEnd,
      endDate
    );

    if (!availableTime) {
      return null;
    }

    const scheduledStartTime = availableTime;
    const scheduledEndTime = new Date(availableTime.getTime() + duration * 60000);

    // Add to time slots
    timeSlots.push({
      startTime: scheduledStartTime,
      endTime: scheduledEndTime,
      task,
      score
    });

    return {
      ...task,
      scheduledStartTime,
      scheduledEndTime
    };
  }).filter((task): task is ScheduledTask => task !== null);

  return [...scheduledTasks, ...rescheduledTasks];
}
