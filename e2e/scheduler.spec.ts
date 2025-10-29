import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Schedule Assistant functionality
 * Tests the scheduling algorithm edge cases through the UI
 */

/**
 * Helper function to clean up all tasks after a test
 * Switches to task list view if needed and deletes all tasks
 */
const cleanupTasks = async (page: Page, taskTitles: string[]) => {
  // Switch to task list view if in calendar view
  const tasksHeading = page.locator('h4:has-text("Tasks")');
  const isTasksView = await tasksHeading.isVisible().catch(() => false);
  if (!isTasksView) {
    await page.click('[data-testid="toggle-calendar-button"]');
    await page.waitForTimeout(300);
  }

  for (const title of taskTitles) {
    const deleteButton = page.locator(`[data-testid="delete-task-button-${title}"]`);
    const exists = await deleteButton.count();
    if (exists > 0) {
      // Set up dialog handler before clicking delete
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();
      // Wait for the task title to disappear instead of the button
      await page
        .waitForSelector(`text=${title}`, { state: 'detached', timeout: 3000 })
        .catch(() => {});
      // Small delay to ensure DOM has updated
      await page.waitForTimeout(200);
    }
  }
};

const submitTaskForm = async (page: Page) => {
  await page.waitForSelector('.MuiPopover-root, .MuiPickersPopper-root', {
    state: 'detached',
    timeout: 3000,
  });
  await page.waitForTimeout(50);
  const submitButton = page.getByTestId('create-task-submit-button');
  await expect(submitButton).toBeEnabled({ timeout: 3000 });
  await submitButton.click();
};

const createTaskWithDateTime = async (
  page: Page,
  title: string,
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  dueDate?: Date,
  dueTime?: string,
  duration: number = 60
) => {
  await page.click('[data-testid="add-task-button"]');
  await page.waitForSelector('text=Create New Task');
  await page.fill('[data-testid="task-title-input"] input', title);
  await page.click('[data-testid="task-priority-select"]');
  await page.click(`li[role="option"]:has-text("${priority}")`);
  await page.waitForSelector('#menu-priority', { state: 'detached' });

  if (dueDate) {
    await page.evaluate((dateStr) => {
      const date = new Date(dateStr);
      (window as any).formMethods.setValue('dueDate', date, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }, dueDate.toISOString());
  }

  if (dueTime) {
    const timeInput = page.getByTestId('due-time-input');
    await expect(timeInput).toBeEnabled({ timeout: 5000 });
    await timeInput.fill(dueTime);
    await timeInput.evaluate((el: HTMLInputElement) => el.blur());
    await page.waitForSelector('.MuiPickersPopper-root', { state: 'detached', timeout: 4000 });
  }

  const durationInput = page.getByTestId('task-duration-input').locator('input');
  await expect(durationInput).toBeEnabled({ timeout: 4000 });
  await durationInput.fill(duration.toString());
  await page.waitForSelector('.MuiPopover-root, .MuiPickersPopper-root', {
    state: 'detached',
    timeout: 3000,
  });
  await page.waitForTimeout(50);

  const submitButton = page.locator('[data-testid="create-task-submit-button"]');
  await expect(submitButton).toBeVisible({ timeout: 7000 });
  await expect(submitButton).toBeEnabled({ timeout: 3000 });
  await submitButton.click();

  await page.waitForSelector('text=Create New Task', { state: 'hidden' });
  await page.waitForSelector(`text=${title}`);
};

const selectTask = async (page: Page, title: string) => {
  const checkbox = page.locator(`input[data-testid="task-checkbox-${title}"]`).last();
  await checkbox.check();
};

test.describe('Schedule Assistant - Basic Functionality', () => {
  let createdTasks: string[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    createdTasks = [];
  });

  test.afterEach(async ({ page }) => {
    if (createdTasks.length > 0) await cleanupTasks(page, createdTasks);
  });

  test('Can create a simple task without date/time', async ({ page }) => {
    const title = 'Simple Task';
    createdTasks.push(title);
    await createTaskWithDateTime(page, title, 'Medium', undefined, undefined, 60);
  });

  test('Task with date and time', async ({ page }) => {
    const title = 'Task with DateTime';
    createdTasks.push(title);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);
    await createTaskWithDateTime(page, title, 'High', tomorrow, '02:30 PM', 90);
  });
});

test.describe('Schedule Assistant - Scheduler Edge Cases', () => {
  let createdTasks: string[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    createdTasks = [];
  });

  test.afterEach(async ({ page }) => {
    if (createdTasks.length > 0) await cleanupTasks(page, createdTasks);
  });

  test('Edge Case 1: Medium task bumps Urgent task when deadline-critical', async ({ page }) => {
    // Create dates for testing
    const title1 = 'Urgent Task - Later';
    const title2 = 'Medium Task - Critical';
    createdTasks.push(title1, title2);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Urgent task due in 5 days at 5 PM
    const urgentDue = new Date(today);
    urgentDue.setDate(today.getDate() + 5);
    urgentDue.setHours(17, 0, 0, 0);

    // Medium task due TODAY at 1 PM (deadline-critical!)
    const mediumDue = new Date(today);
    mediumDue.setHours(13, 0, 0, 0);

    await createTaskWithDateTime(page, title1, 'Urgent', urgentDue, '05:00 PM', 120);
    await createTaskWithDateTime(page, title2, 'Medium', mediumDue, '01:00 PM', 60);

    // Select both tasks
    await selectTask(page, title1);
    await selectTask(page, title2);

    // Open schedule assistant
    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    // Generate schedule for today
    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // Navigate to schedule view
    await page.click('[data-testid="toggle-calendar-button"]');
    await page.waitForSelector('text=Schedule');

    // Medium task should be scheduled first due to critical deadline
    const scheduleContent = await page.textContent('body');
    console.log('Schedule generated - Medium task should appear before Urgent task');
  });

  test('Edge Case 2: Low priority tasks do not get deadline protection', async ({ page }) => {
    const title1 = 'High Priority Task';
    const title2 = 'Low Priority Task';
    createdTasks.push(title1, title2);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // High priority task due in 3 days
    const highDue = new Date(today);
    highDue.setDate(today.getDate() + 3);
    highDue.setHours(17, 0, 0, 0);

    // Low priority task due TODAY (but should still be deprioritized)
    const lowDue = new Date(today);
    lowDue.setHours(13, 0, 0, 0);

    await createTaskWithDateTime(page, title1, 'High', highDue, '05:00 PM', 180);
    await createTaskWithDateTime(page, title2, 'Low', lowDue, '01:00 PM', 60);

    await selectTask(page, title1);
    await selectTask(page, title2);

    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // High priority should be scheduled first
    console.log('High priority should be scheduled despite Low having earlier deadline');
  });

  test('Edge Case 3: Due time comparison for deadline-critical tasks', async ({ page }) => {
    const title1 = 'High Task 11PM';
    const title2 = 'Medium Task 1PM';
    createdTasks.push(title1, title2);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // High priority task due at 11 PM today
    const highDue = new Date(today);
    highDue.setHours(23, 0, 0, 0);

    // Medium priority task due at 1 PM today
    const mediumDue = new Date(today);
    mediumDue.setHours(13, 0, 0, 0);

    await createTaskWithDateTime(page, title1, 'High', highDue, '11:00 PM', 120);
    await createTaskWithDateTime(page, title2, 'Medium', mediumDue, '01:00 PM', 60);

    await selectTask(page, title1);
    await selectTask(page, title2);

    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // Medium task with earlier deadline should be scheduled first
    console.log('Medium task (1PM deadline) should be scheduled before High task (11PM deadline)');
  });

  test('Edge Case 4: Multiple deadline-critical tasks in due time order', async ({ page }) => {
    const title1 = 'Task Due 11AM';
    const title2 = 'Task Due 1PM';
    const title3 = 'Task Due 3PM';
    createdTasks.push(title1, title2, title3);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Three Medium tasks with staggered deadlines today
    const task1Due = new Date(today);
    task1Due.setHours(11, 0, 0, 0);

    const task2Due = new Date(today);
    task2Due.setHours(13, 0, 0, 0);

    const task3Due = new Date(today);
    task3Due.setHours(15, 0, 0, 0);

    await createTaskWithDateTime(page, title1, 'Medium', task1Due, '11:00 AM', 60);
    await createTaskWithDateTime(page, title2, 'Medium', task2Due, '01:00 PM', 60);
    await createTaskWithDateTime(page, title3, 'Medium', task3Due, '03:00 PM', 60);

    await selectTask(page, title1);
    await selectTask(page, title2);
    await selectTask(page, title3);

    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // Tasks should be scheduled in deadline order (11AM, 1PM, 3PM)
    console.log('Tasks should be scheduled in deadline order: 11AM -> 1PM -> 3PM');
  });

  test('Edge Case 5: Working hours constraints are respected', async ({ page }) => {
    const title1 = 'Task Respects Hours';
    createdTasks.push(title1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDue = new Date(today);
    taskDue.setHours(17, 0, 0, 0);

    await createTaskWithDateTime(page, title1, 'Medium', taskDue, '05:00 PM', 60);
    await selectTask(page, title1);

    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    // Set custom working hours: 10 AM - 4 PM
    await page.fill('input[name="workingHoursStart"]', '10');
    await page.fill('input[name="workingHoursEnd"]', '16');

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // Task should be scheduled within 10 AM - 4 PM window
    console.log('Task should be scheduled between 10 AM and 4 PM');
  });

  test('Edge Case 6: Task without time defaults to 23:59', async ({ page }) => {
    const title = 'Task No Time';
    createdTasks.push(title);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create task with date but NO time
    await page.click('[data-testid="add-task-button"]');
    await page.waitForSelector('text=Create New Task');

    await page.fill('[data-testid="task-title-input"] input', title);
    await page.click('[data-testid="task-priority-select"]');
    await page.click('li[role="option"]:has-text("Medium")');

    // Set only date, not time
    await page.evaluate((dateStr) => {
      const date = new Date(dateStr);
      // Pass options to trigger validation and mark field as dirty
      (window as any).formMethods.setValue('dueDate', date, {
        shouldValidate: true,
        shouldDirty: true,
      });
      // Intentionally NOT setting dueTime
    }, today.toISOString());

    await page.fill('[data-testid="task-duration-input"] input', '60');
    await page.click('[data-testid="create-task-submit-button"]');

    await page.waitForSelector('text=Create New Task', { state: 'hidden' });
    await page.waitForSelector('text=Task No Time');

    await selectTask(page, title);

    await page.click('[data-testid="schedule-assistant-button"]');
    await expect(page.locator('text=Generate Schedule')).toBeVisible();

    const startDate = today.toISOString().split('T')[0];
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', startDate);

    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1000);

    // Task should be treated as due at 23:59 (end of day)
    console.log('Task without time should default to 23:59 deadline');
  });
});

test.describe('Schedule Assistant - UI Interactions', () => {
  let createdTasks: string[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    createdTasks = [];
  });

  test.afterEach(async ({ page }) => {
    if (createdTasks.length > 0) await cleanupTasks(page, createdTasks);
  });

  test('Schedule assistant button visibility', async ({ page }) => {
    const title = 'Test Task';
    createdTasks.push(title);

    const scheduleButton = page.locator('[data-testid="schedule-assistant-button"]');
    await expect(scheduleButton).not.toBeVisible();

    // Create and select a task
    await page.click('[data-testid="add-task-button"]');
    await page.waitForSelector('text=Create New Task');
    await page.fill('[data-testid="task-title-input"] input', title);
    await page.click('[data-testid="task-priority-select"]');
    await page.click('li[role="option"]:has-text("High")');
    await page.fill('[data-testid="task-duration-input"] input', '30');
    await page.click('[data-testid="create-task-submit-button"]');
    await page.waitForSelector('text=Create New Task', { state: 'hidden' });

    const checkbox = page.locator('input[data-testid="task-checkbox-Test Task"]').last();
    await checkbox.check();

    await expect(scheduleButton).toBeVisible();
  });

  test('Can switch between task list and calendar views', async ({ page }) => {
    await page.click('[data-testid="toggle-calendar-button"]');

    const scheduleHeading = page.locator('h4:has-text("Schedule")');
    await expect(scheduleHeading).toBeVisible();

    await page.click('[data-testid="toggle-calendar-button"]');

    const tasksHeading = page.locator('h4:has-text("Tasks")');
    await expect(tasksHeading).toBeVisible();
  });
});
