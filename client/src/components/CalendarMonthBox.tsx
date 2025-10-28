import { Paper, Typography, Box } from '@mui/material';
import { Task, TaskPriority } from '../types/task.types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth
} from 'date-fns';
import { CalendarDayCell } from './CalendarDayCell';

interface CalendarMonthBoxProps {
  month: Date;
  today: Date;
  isCurrentMonth: boolean;
  tasksByDay: Map<string, Task[]>;
  priorityColors: Record<TaskPriority, string>;
  onTaskClick: (task: Task) => void;
}

/**
 * Calendar month box component
 * Single responsibility: Render a single month view with all its days
 */
export function CalendarMonthBox({
  month,
  today,
  isCurrentMonth,
  tasksByDay,
  priorityColors,
  onTaskClick
}: CalendarMonthBoxProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Get the calendar grid including padding days from previous/next month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Paper
      sx={{
        p: 2,
        border: isCurrentMonth ? '2px solid' : '1px solid',
        borderColor: isCurrentMonth ? 'primary.main' : 'divider'
      }}
    >
      <Typography variant="h6" gutterBottom textAlign="center">
        {format(month, 'MMMM yyyy')}
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <Typography
            key={day}
            variant="caption"
            textAlign="center"
            fontWeight="bold"
            sx={{ py: 0.5 }}
          >
            {day}
          </Typography>
        ))}
        {allDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(dayKey) || [];
          const isCurrentMonthDay = isSameMonth(day, month);

          return (
            <CalendarDayCell
              key={dayKey}
              day={day}
              today={today}
              dayTasks={dayTasks}
              viewType="month"
              isCurrentMonthDay={isCurrentMonthDay}
              priorityColors={priorityColors}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </Box>
    </Paper>
  );
}