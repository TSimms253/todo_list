import { Box, Typography } from '@mui/material';
import { Task, TaskPriority } from '../types/task.types';
import { format, isSameDay } from 'date-fns';
import { CalendarTaskCard } from './CalendarTaskCard';

type ViewType = 'week' | 'month' | '3months' | '6months' | 'year';

interface CalendarDayCellProps {
  day: Date;
  today: Date;
  dayTasks: Task[];
  viewType: ViewType;
  isCurrentMonthDay?: boolean;
  priorityColors: Record<TaskPriority, string>;
  onTaskClick: (task: Task) => void;
}

/**
 * Calendar day cell component
 * Single responsibility: Render a single day cell with its tasks
 */
export function CalendarDayCell({
  day,
  today,
  dayTasks,
  viewType,
  isCurrentMonthDay = true,
  priorityColors,
  onTaskClick
}: CalendarDayCellProps) {
  const isToday = isSameDay(day, today);
  const maxTasks = viewType === 'week' ? 10 : 3;
  const visibleTasks = dayTasks.slice(0, maxTasks);
  const hasMoreTasks = dayTasks.length > maxTasks;

  return (
    <Box
      sx={{
        minHeight: viewType === 'week' ? '200px' : '100px',
        border: '1px solid',
        borderColor: isToday ? 'primary.main' : 'divider',
        borderRadius: 1,
        p: 1,
        backgroundColor: isToday ? 'action.hover' : 'background.paper',
        opacity: isCurrentMonthDay ? 1 : 0.3
      }}
    >
      <Typography
        variant="caption"
        fontWeight={isToday ? 'bold' : 'normal'}
        color={isToday ? 'primary' : 'text.primary'}
        gutterBottom
      >
        {format(day, viewType === 'week' ? 'EEE dd' : 'd')}
      </Typography>

      <Box display="flex" flexDirection="column" gap={0.5}>
        {visibleTasks.map((task) => (
          <CalendarTaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            priorityColors={priorityColors}
          />
        ))}
        {hasMoreTasks && (
          <Typography variant="caption" color="text.secondary" fontSize="0.6rem">
            +{dayTasks.length - maxTasks} more
          </Typography>
        )}
      </Box>
    </Box>
  );
}