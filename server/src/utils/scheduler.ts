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
 * Checks if scheduling a task at the given time would cause it to miss its due date
 */
function wouldMissDueDate(task: Task, scheduledEndTime: Date): boolean {
  if (!task.dueDate) return false;
  return scheduledEndTime > new Date(task.dueDate);
}

/**
 * Determines if a task is deadline-critical
 * A task is deadline-critical if:
 * - It's Medium or High priority (NOT Low)
 * - It would miss its deadline at the scheduled time
 */
function isDeadlineCritical(task: Task, scheduledEndTime: Date): boolean {
  // Low priority tasks are never deadline-critical
  if (task.priority === TaskPriority.LOW) return false;

  // Medium and High priority tasks are deadline-critical if they'd miss their deadline
  if (task.priority === TaskPriority.MEDIUM || task.priority === TaskPriority.HIGH) {
    return wouldMissDueDate(task, scheduledEndTime);
  }

  // Urgent tasks use standard priority logic
  return false;
}

/**
 * Calculates how many working minutes are available between two dates
 */
function calculateAvailableWorkingMinutes(
  fromDate: Date,
  toDate: Date,
  workingHoursStart: number,
  workingHoursEnd: number
): number {
  const workingHoursPerDay = workingHoursEnd - workingHoursStart;
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const timeDiff = toDate.getTime() - fromDate.getTime();
  const daysAvailable = timeDiff / millisecondsPerDay;

  // Convert to working minutes
  return Math.floor(daysAvailable * workingHoursPerDay * 60);
}

/**
 * Checks if a task can be safely pushed back without missing its due date
 */
function canBeSafelyPushed(
  task: Task,
  currentScheduledEnd: Date,
  duration: number,
  workingHoursStart: number,
  workingHoursEnd: number
): boolean {
  if (!task.dueDate) return true; // No due date means it can always be pushed

  const dueDate = new Date(task.dueDate);

  // If already past due date, cannot be safely pushed
  if (currentScheduledEnd >= dueDate) return false;

  // Calculate working minutes available between current end and due date
  const availableMinutes = calculateAvailableWorkingMinutes(
    currentScheduledEnd,
    dueDate,
    workingHoursStart,
    workingHoursEnd
  );

  // Can be pushed if there's at least the task duration available
  return availableMinutes >= duration;
}

/**
 * Checks if a task can complete before its due time if started at the proposed time
 */
function canCompleteBeforeDueTime(
  proposedStartTime: Date,
  duration: number,
  dueDate: Date,
  workingHoursStart: number,
  workingHoursEnd: number
): boolean {
  const proposedEndTime = new Date(proposedStartTime.getTime() + duration * 60000);

  // Simple check: would the task end before its due date/time?
  return proposedEndTime <= dueDate;
}

/**
 * When both tasks are deadline-critical, determines which should be scheduled first
 * based on their due times. Returns true if currentTask should take priority over conflictingTask.
 */
function shouldPrioritizeByDueTime(
  currentTask: Task,
  currentScheduledStart: Date,
  currentScheduledEnd: Date,
  conflictingTask: Task,
  conflictingScheduledStart: Date,
  conflictingScheduledEnd: Date,
  workingHoursStart: number,
  workingHoursEnd: number
): boolean {
  if (!currentTask.dueDate || !conflictingTask.dueDate) return false;

  const currentDueDate = new Date(currentTask.dueDate);
  const conflictingDueDate = new Date(conflictingTask.dueDate);
  const currentDuration = currentTask.estimatedDuration || 60;
  const conflictingDuration = conflictingTask.estimatedDuration || 60;

  // If current task is due earlier, check if we can swap them
  if (currentDueDate < conflictingDueDate) {
    // Current task is due first - check if both can complete if we bump the conflicting task

    // Can current task complete at its proposed time?
    const currentCanComplete = canCompleteBeforeDueTime(
      currentScheduledStart,
      currentDuration,
      currentDueDate,
      workingHoursStart,
      workingHoursEnd
    );

    if (!currentCanComplete) {
      // Current task can't complete at this time, so it should take priority
      return true;
    }

    // Can conflicting task complete if pushed to after current task?
    const newConflictingStart = new Date(currentScheduledEnd);
    const conflictingCanCompleteAfter = canCompleteBeforeDueTime(
      newConflictingStart,
      conflictingDuration,
      conflictingDueDate,
      workingHoursStart,
      workingHoursEnd
    );

    // If both can complete with current first, prioritize current (earlier due time)
    if (conflictingCanCompleteAfter) {
      return true;
    }
  } else {
    // Conflicting task is due first - check if it should keep its spot

    // Can conflicting task complete at its current time?
    const conflictingCanComplete = canCompleteBeforeDueTime(
      conflictingScheduledStart,
      conflictingDuration,
      conflictingDueDate,
      workingHoursStart,
      workingHoursEnd
    );

    // Can current task complete if pushed to after conflicting task?
    const newCurrentStart = new Date(conflictingScheduledEnd);
    const currentCanCompleteAfter = canCompleteBeforeDueTime(
      newCurrentStart,
      currentDuration,
      currentDueDate,
      workingHoursStart,
      workingHoursEnd
    );

    // If both can complete with conflicting first, don't bump it
    if (conflictingCanComplete && currentCanCompleteAfter) {
      return false;
    }

    // If conflicting can't complete but current can if it goes first, bump it
    if (!conflictingCanComplete) {
      const currentWouldComplete = canCompleteBeforeDueTime(
        currentScheduledStart,
        currentDuration,
        currentDueDate,
        workingHoursStart,
        workingHoursEnd
      );
      return currentWouldComplete;
    }
  }

  return false;
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

  // Ensure we start at or after working hours (using UTC to match ISO date strings)
  if (currentTime.getUTCHours() < workingHoursStart) {
    currentTime.setUTCHours(workingHoursStart, 0, 0, 0);
  }

  while (currentTime <= endDate) {
    const proposedEndTime = new Date(currentTime.getTime() + duration * 60000);
    const endHour = proposedEndTime.getUTCHours() + proposedEndTime.getUTCMinutes() / 60;

    // Check if we exceed working hours
    if (endHour > workingHoursEnd) {
      // Move to next day
      currentTime.setUTCDate(currentTime.getUTCDate() + 1);
      currentTime.setUTCHours(workingHoursStart, 0, 0, 0);
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

  // Normalize start date to beginning of the day (using UTC to match ISO date strings)
  const startDate = new Date(request.startDate);
  startDate.setUTCHours(0, 0, 0, 0);

  // Normalize end date to end of the day (using UTC to match ISO date strings)
  const endDate = new Date(request.endDate);
  endDate.setUTCHours(23, 59, 59, 999);

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

    // For Medium/High priority tasks with due dates, check if they should try for early slot
    let shouldTryEarlySlot = false;
    if ((task.priority === TaskPriority.MEDIUM || task.priority === TaskPriority.HIGH) && task.dueDate) {
      const earliestStart = new Date(startDate);
      earliestStart.setUTCHours(request.workingHoursStart, 0, 0, 0);
      const earliestEnd = new Date(earliestStart.getTime() + duration * 60000);

      // Check if earliest slot is already occupied
      const hasEarlyConflicts = timeSlots.some(slot =>
        timeSlotsOverlap(earliestStart, earliestEnd, slot.startTime, slot.endTime)
      );

      if (hasEarlyConflicts) {
        // Check if this task is due today or very soon
        const taskDueDate = new Date(task.dueDate);
        const daysUntilDue = (taskDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        // If due within 1 day (today or tomorrow), try for early slot
        if (daysUntilDue < 1) {
          shouldTryEarlySlot = true;
        } else {
          // For tasks due later, check if next available slot would make it deadline-critical
          const nextAvailableSlot = findNextAvailableSlot(
            startDate,
            duration,
            timeSlots,
            request.workingHoursStart,
            request.workingHoursEnd,
            endDate
          );

          if (nextAvailableSlot) {
            const nextAvailableEnd = new Date(nextAvailableSlot.getTime() + duration * 60000);
            shouldTryEarlySlot = isDeadlineCritical(task, nextAvailableEnd);
          }
        }
      }
    }

    let scheduledStartTime: Date;
    let scheduledEndTime: Date;
    let conflictingSlots: TimeSlot[] = [];

    if (shouldTryEarlySlot) {
      // Try to schedule at the earliest possible time
      const earliestStart = new Date(startDate);
      earliestStart.setUTCHours(request.workingHoursStart, 0, 0, 0);
      const earliestEnd = new Date(earliestStart.getTime() + duration * 60000);

      scheduledStartTime = earliestStart;
      scheduledEndTime = earliestEnd;

      // Find all conflicts at this early slot
      conflictingSlots = timeSlots.filter(slot =>
        timeSlotsOverlap(scheduledStartTime, scheduledEndTime, slot.startTime, slot.endTime)
      );
    } else {
      // Use standard next available slot logic
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

      scheduledStartTime = availableTime;
      scheduledEndTime = new Date(availableTime.getTime() + duration * 60000);

      // Check for any conflicts (should be none from findNextAvailableSlot)
      conflictingSlots = timeSlots.filter(slot =>
        timeSlotsOverlap(scheduledStartTime, scheduledEndTime, slot.startTime, slot.endTime)
      );
    }

    // Check if this task is deadline-critical
    // If we tried for early slot due to deadline, check if next available would make us critical
    let thisTaskIsDeadlineCritical = isDeadlineCritical(task, scheduledEndTime);

    if (shouldTryEarlySlot && conflictingSlots.length > 0 && !thisTaskIsDeadlineCritical) {
      // We're trying early slot but not deadline-critical at this slot
      // Check if we'd be deadline-critical at the next available slot
      const nextAvailable = findNextAvailableSlot(
        startDate,
        duration,
        timeSlots,
        request.workingHoursStart,
        request.workingHoursEnd,
        endDate
      );
      if (nextAvailable) {
        const nextAvailableEnd = new Date(nextAvailable.getTime() + duration * 60000);
        thisTaskIsDeadlineCritical = isDeadlineCritical(task, nextAvailableEnd);
      }
    }

    if (conflictingSlots.length > 0) {
      const tasksToBump: TimeSlot[] = [];

      // If this task is deadline-critical, it can bump even higher priority tasks
      if (thisTaskIsDeadlineCritical) {
        // Check ALL conflicting tasks (including higher priority ones)
        for (const slot of conflictingSlots) {
          const conflictingTaskDuration = slot.task.estimatedDuration || 60;
          const conflictingTaskIsDeadlineCritical = isDeadlineCritical(slot.task, slot.endTime);

          // Both tasks are deadline-critical - use due time comparison
          if (conflictingTaskIsDeadlineCritical) {
            // Determine priority based on due times and whether both can complete
            const shouldBump = shouldPrioritizeByDueTime(
              task,
              scheduledStartTime,
              scheduledEndTime,
              slot.task,
              slot.startTime,
              slot.endTime,
              request.workingHoursStart,
              request.workingHoursEnd
            );

            if (shouldBump) {
              tasksToBump.push(slot);
            }
            continue;
          }

          // Check if the conflicting task can be safely pushed
          const canPush = canBeSafelyPushed(
            slot.task,
            slot.endTime,
            conflictingTaskDuration,
            request.workingHoursStart,
            request.workingHoursEnd
          );

          // Bump the task if it can be safely rescheduled
          if (canPush) {
            tasksToBump.push(slot);
          }
        }
      } else {
        // For tasks due today, use due time comparison even if not deadline-critical
        if (task.dueDate && shouldTryEarlySlot) {
          const taskDueDate = new Date(task.dueDate);
          const daysUntilDue = (taskDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          // If task is due within 1 day, check due times against conflicting tasks
          if (daysUntilDue < 1) {
            for (const slot of conflictingSlots) {
              if (slot.task.dueDate) {
                const conflictingDueDate = new Date(slot.task.dueDate);
                const conflictingDuration = slot.task.estimatedDuration || 60;

                // If current task is due earlier in the day
                if (taskDueDate < conflictingDueDate) {
                  // Check if both can complete if we swap them
                  const conflictingCanCompleteAfter = canCompleteBeforeDueTime(
                    scheduledEndTime,
                    conflictingDuration,
                    conflictingDueDate,
                    request.workingHoursStart,
                    request.workingHoursEnd
                  );

                  // Check if conflicting task can be safely pushed
                  const canPush = canBeSafelyPushed(
                    slot.task,
                    slot.endTime,
                    conflictingDuration,
                    request.workingHoursStart,
                    request.workingHoursEnd
                  );

                  if (conflictingCanCompleteAfter && canPush) {
                    tasksToBump.push(slot);
                  }
                }
              }
            }
          }
        }

        // Standard priority-based scheduling (for non-deadline-critical tasks)
        const lowerPriorityConflicts = conflictingSlots.filter(slot => slot.score < score);

        for (const slot of lowerPriorityConflicts) {
          const conflictingTaskDuration = slot.task.estimatedDuration || 60;
          const conflictingTaskIsDeadlineCritical = isDeadlineCritical(slot.task, slot.endTime);

          // Never bump a deadline-critical task with a non-deadline-critical task
          if (conflictingTaskIsDeadlineCritical) {
            continue;
          }

          // Don't bump if already marked for bumping by due time logic
          if (tasksToBump.includes(slot)) {
            continue;
          }

          // Standard bumping logic
          tasksToBump.push(slot);
        }
      }

      // Remove tasks that should be bumped from time slots and scheduled tasks, mark for rescheduling
      tasksToBump.forEach(slot => {
        const timeSlotIndex = timeSlots.indexOf(slot);
        if (timeSlotIndex > -1) {
          timeSlots.splice(timeSlotIndex, 1);
        }

        // Also remove from scheduledTasks if it was already added
        const scheduledTaskIndex = scheduledTasks.findIndex(t => t.id === slot.task.id);
        if (scheduledTaskIndex > -1) {
          scheduledTasks.splice(scheduledTaskIndex, 1);
        }

        tasksToReschedule.push(slot.task);
      });

      // If we tried early slot but couldn't bump anything, find next available slot
      if (shouldTryEarlySlot && tasksToBump.length === 0) {
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

        scheduledStartTime = availableTime;
        scheduledEndTime = new Date(availableTime.getTime() + duration * 60000);
      }
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
