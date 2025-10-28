import { Card, CardContent, Typography } from '@mui/material';
import { Task, TaskPriority, TaskStatus } from '../types/task.types';
import { format, parseISO } from 'date-fns';

interface CalendarTaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  priorityColors: Record<TaskPriority, string>;
}

/**
 * Individual task card component for calendar views
 * Single responsibility: Render a single task card with appropriate styling
 */
export function CalendarTaskCard({ task, onClick, priorityColors }: CalendarTaskCardProps) {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <Card
      onClick={() => onClick(task)}
      sx={{
        backgroundColor: priorityColors[task.priority] + '20',
        borderLeft: `3px solid ${priorityColors[task.priority]}`,
        borderRight: isInProgress ? `3px solid #2196f3` : 'none',
        cursor: 'pointer',
        opacity: isCompleted ? 0.5 : 1,
        position: 'relative',
        '&:hover': {
          backgroundColor: priorityColors[task.priority] + '40',
          transform: 'scale(1.02)',
          transition: 'all 0.2s'
        },
        ...(isInProgress && {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 12px 12px 0',
            borderColor: 'transparent #2196f3 transparent transparent'
          }
        })
      }}
    >
      <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
        <Typography
          variant="caption"
          fontWeight="bold"
          display="block"
          fontSize="0.65rem"
          sx={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
        >
          {task.scheduledStartTime && formatTime(task.scheduledStartTime)}
        </Typography>
        <Typography
          variant="caption"
          noWrap
          title={task.title}
          fontSize="0.65rem"
          sx={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
        >
          {task.title}
        </Typography>
      </CardContent>
    </Card>
  );
}