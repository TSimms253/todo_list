import { create } from 'zustand';
import { Task } from '../types/task.types';

interface TaskStore {
  selectedTaskIds: string[];
  toggleTaskSelection: (taskId: string) => void;
  clearSelection: () => void;
  selectAll: (tasks: Task[]) => void;
  isTaskSelected: (taskId: string) => boolean;
}

/**
 * Zustand store for managing task selection state
 * Follows single responsibility principle - only handles task selection
 */
export const useTaskStore = create<TaskStore>((set, get) => ({
  selectedTaskIds: [],

  toggleTaskSelection: (taskId: string) => {
    set((state) => ({
      selectedTaskIds: state.selectedTaskIds.includes(taskId)
        ? state.selectedTaskIds.filter(id => id !== taskId)
        : [...state.selectedTaskIds, taskId]
    }));
  },

  clearSelection: () => {
    set({ selectedTaskIds: [] });
  },

  selectAll: (tasks: Task[]) => {
    set({ selectedTaskIds: tasks.map(t => t.id) });
  },

  isTaskSelected: (taskId: string) => {
    return get().selectedTaskIds.includes(taskId);
  }
}));
