import { Task, CreateTaskDto, UpdateTaskDto, ScheduleRequest } from '../types/task.types';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Fetches all tasks from the API
 */
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`);

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const result: ApiResponse<Task[]> = await response.json();
  return result.data || [];
}

/**
 * Fetches a single task by ID
 */
export async function fetchTaskById(id: string): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch task');
  }

  const result: ApiResponse<Task> = await response.json();

  if (!result.data) {
    throw new Error('Task not found');
  }

  return result.data;
}

/**
 * Creates a new task
 */
export async function createTask(taskData: CreateTaskDto): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }

  const result: ApiResponse<Task> = await response.json();

  if (!result.data) {
    throw new Error('Failed to create task');
  }

  return result.data;
}

/**
 * Updates an existing task
 */
export async function updateTask(id: string, taskData: UpdateTaskDto): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update task');
  }

  const result: ApiResponse<Task> = await response.json();

  if (!result.data) {
    throw new Error('Failed to update task');
  }

  return result.data;
}

/**
 * Deletes a task
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
}

/**
 * Schedules tasks based on priority
 */
export async function scheduleTasks(request: ScheduleRequest): Promise<Task[]> {
  const response = await fetch(`${API_BASE_URL}/tasks/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to schedule tasks');
  }

  const result: ApiResponse<Task[]> = await response.json();
  return result.data || [];
}
