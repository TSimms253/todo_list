export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  estimatedDuration?: number; // in minutes
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
  estimatedDuration?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  estimatedDuration?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

export interface ScheduleRequest {
  taskIds: string[];
  startDate: string;
  endDate: string;
  workingHoursStart: number; // hour in 24h format (e.g., 9)
  workingHoursEnd: number; // hour in 24h format (e.g., 17)
}

export interface ScheduledTask extends Task {
  scheduledStartTime: Date;
  scheduledEndTime: Date;
}
