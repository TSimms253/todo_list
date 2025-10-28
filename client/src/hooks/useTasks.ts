import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  fetchTaskById,
  createTask,
  updateTask,
  deleteTask,
  scheduleTasks
} from '../api/taskApi';
import { CreateTaskDto, UpdateTaskDto, ScheduleRequest } from '../types/task.types';

/**
 * Hook for fetching all tasks
 * Uses TanStack Query for caching and automatic refetching
 */
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true
  });
}

/**
 * Hook for fetching a single task
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => fetchTaskById(id),
    enabled: !!id
  });
}

/**
 * Hook for creating a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskDto) => createTask(taskData),
    onSuccess: () => {
      // Invalidate and refetch tasks after creation
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

/**
 * Hook for updating a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      updateTask(id, data),
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific task
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    }
  });
}

/**
 * Hook for deleting a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      // Invalidate tasks list after deletion
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

/**
 * Hook for scheduling tasks
 */
export function useScheduleTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ScheduleRequest) => scheduleTasks(request),
    onSuccess: () => {
      // Invalidate tasks to reflect the new schedule
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}
