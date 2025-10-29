import { useState } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { Task, TaskStatus, UpdateTaskDto } from '../types/task.types';
import { TaskItem } from './TaskItem';
import { TaskEditDialog } from './TaskEditDialog';
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, data: { status } });
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (id: string, data: UpdateTaskDto) => {
    await updateTaskMutation.mutateAsync({ id, data });
    handleCloseEditDialog();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTaskMutation.mutateAsync(id);
    handleCloseEditDialog();
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
    <>
      <Box>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            selected={selectedTaskIds.includes(task.id)}
            onToggleSelect={toggleTaskSelection}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
          />
        ))}
      </Box>

      <TaskEditDialog
        open={editDialogOpen}
        task={selectedTask}
        onClose={handleCloseEditDialog}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
        isSubmitting={updateTaskMutation.isPending || deleteTaskMutation.isPending}
      />
    </>
  );
}
