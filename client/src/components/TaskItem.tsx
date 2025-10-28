import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Task, TaskPriority, TaskStatus } from '../types/task.types';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  selected: boolean;
  onToggleSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const priorityColors: Record<TaskPriority, 'error' | 'warning' | 'info' | 'default'> = {
  [TaskPriority.URGENT]: 'error',
  [TaskPriority.HIGH]: 'warning',
  [TaskPriority.MEDIUM]: 'info',
  [TaskPriority.LOW]: 'default'
};

const statusColors: Record<TaskStatus, 'success' | 'primary' | 'default'> = {
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.IN_PROGRESS]: 'primary',
  [TaskStatus.TODO]: 'default'
};

/**
 * Individual task item component
 * Single responsibility: Display a single task with actions
 */
export function TaskItem({
  task,
  selected,
  onToggleSelect,
  onDelete,
  onStatusChange
}: TaskItemProps) {
  const handleStatusClick = () => {
    const nextStatus =
      task.status === TaskStatus.TODO
        ? TaskStatus.IN_PROGRESS
        : task.status === TaskStatus.IN_PROGRESS
        ? TaskStatus.COMPLETED
        : TaskStatus.TODO;

    onStatusChange(task.id, nextStatus);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return null;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        opacity: task.status === TaskStatus.COMPLETED ? 0.7 : 1,
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect(task.id)}
            sx={{ mt: -1 }}
          />

          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography
                variant="h6"
                sx={{
                  textDecoration:
                    task.status === TaskStatus.COMPLETED ? 'line-through' : 'none'
                }}
              >
                {task.title}
              </Typography>
              <Chip
                label={task.priority}
                color={priorityColors[task.priority]}
                size="small"
              />
              <Chip
                label={task.status.replace('_', ' ')}
                color={statusColors[task.status]}
                size="small"
                onClick={handleStatusClick}
                sx={{ cursor: 'pointer' }}
              />
            </Box>

            {task.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {task.description}
              </Typography>
            )}

            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
              {task.dueDate && (
                <Typography variant="caption" color="text.secondary">
                  Due: {formatDate(task.dueDate)}
                </Typography>
              )}
              {task.estimatedDuration && (
                <Typography variant="caption" color="text.secondary">
                  Est. {task.estimatedDuration} min
                </Typography>
              )}
              {task.scheduledStartTime && (
                <Typography variant="caption" color="primary">
                  Scheduled: {formatDate(task.scheduledStartTime)}
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(task.id)}
              aria-label="delete task"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
