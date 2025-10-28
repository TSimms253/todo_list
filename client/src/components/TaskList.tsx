import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { Task, TaskStatus } from '../types/task.types';
import { TaskItem } from './TaskItem';
import { useTaskStore } from '../store/taskStore';
import { useUpdateTask, useDeleteTask } from '../hooks/useTasks';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

/**
 * Skeleton loader for task list
 */
function TaskListSkeleton() {
  return (
    <Box>
      {[1, 2, 3].map((i) => (
        <Paper key={i} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" gap={2}>
            <Skeleton variant="rectangular" width={24} height={24} />
            <Box flex={1}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

/**
 * Task list component with selection and actions
 * Single responsibility: Display list of tasks and handle user interactions
 */
export function TaskList({ tasks, isLoading = false }: TaskListProps) {
  const { selectedTaskIds, toggleTaskSelection } = useTaskStore();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, data: { status } });
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No tasks yet. Create your first task to get started!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          selected={selectedTaskIds.includes(task.id)}
          onToggleSelect={toggleTaskSelection}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ))}
    </Box>
  );
}
