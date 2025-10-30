import { useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { Task, TaskPriority, UpdateTaskDto } from '../types/task.types';
import { useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { TaskEditDialog } from './TaskEditDialog';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarMonthBox } from './CalendarMonthBox';
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  addDays,
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameMonth,
  parseISO
} from 'date-fns';

interface CalendarProps {
  tasks: Task[];
}

const priorityColors: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: '#d32f2f',
  [TaskPriority.HIGH]: '#f57c00',
  [TaskPriority.MEDIUM]: '#1976d2',
  [TaskPriority.LOW]: '#757575'
};

type ViewType = 'week' | 'month' | '3months' | '6months' | 'year';

/**
 * Calendar component displaying scheduled tasks
 * Single responsibility: Visualize tasks in various time ranges
 */
export function Calendar({ tasks }: CalendarProps) {
  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  const handleTaskClick = (task: Task) => {
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

  const today = new Date();

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    switch (viewType) {
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        return eachDayOfInterval({
          start: weekStart,
          end: addDays(weekStart, 6)
        });
      case 'month':
        return eachDayOfInterval({
          start: startOfMonth(today),
          end: endOfMonth(today)
        });
      case '3months':
      case '6months':
      case 'year':
        // For multi-month views, we'll return an array of months
        const monthCount = viewType === '3months' ? 3 : viewType === '6months' ? 6 : 12;
        return eachMonthOfInterval({
          start: startOfMonth(today),
          end: addMonths(startOfMonth(today), monthCount - 1)
        });
      default:
        return [];
    }
  }, [viewType]);

  // Group scheduled tasks by day
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (task.scheduledStartTime) {
        try {
          const taskDate = parseISO(task.scheduledStartTime);
          const dayKey = format(taskDate, 'yyyy-MM-dd');

          if (!grouped.has(dayKey)) {
            grouped.set(dayKey, []);
          }
          grouped.get(dayKey)!.push(task);
        } catch (error) {
          console.error('Error parsing task date:', error);
        }
      }
    });

    // Sort tasks within each day by start time
    grouped.forEach((dayTasks) => {
      dayTasks.sort((a, b) => {
        const timeA = a.scheduledStartTime ? new Date(a.scheduledStartTime).getTime() : 0;
        const timeB = b.scheduledStartTime ? new Date(b.scheduledStartTime).getTime() : 0;
        return timeA - timeB;
      });
    });

    return grouped;
  }, [tasks]);

  const renderDayCell = (day: Date, isCurrentMonthDay: boolean = true) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDay.get(dayKey) || [];

    return (
      <CalendarDayCell
        key={dayKey}
        day={day}
        today={today}
        dayTasks={dayTasks}
        viewType={viewType}
        isCurrentMonthDay={isCurrentMonthDay}
        priorityColors={priorityColors}
        onTaskClick={handleTaskClick}
      />
    );
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'week':
        return "This Week's Schedule";
      case 'month':
        return format(today, 'MMMM yyyy');
      case '3months':
        return '3 Month View';
      case '6months':
        return '6 Month View';
      case 'year':
        return format(today, 'yyyy');
      default:
        return 'Schedule';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{getViewTitle()}</Typography>
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="3months">3 Months</ToggleButton>
          <ToggleButton value="6months">6 Months</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewType === 'week' && (
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
          {(dateRange as Date[]).map((day) => renderDayCell(day, true))}
        </Box>
      )}

      {viewType === 'month' && (() => {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

        return (
          <Box>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} mb={1}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Typography
                  key={day}
                  variant="subtitle2"
                  textAlign="center"
                  fontWeight="bold"
                >
                  {day}
                </Typography>
              ))}
            </Box>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
              {allDays.map((day) => renderDayCell(day, isSameMonth(day, today)))}
            </Box>
          </Box>
        );
      })()}

      {(viewType === '3months' || viewType === '6months' || viewType === 'year') && (
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {(dateRange as Date[]).map((month) => (
            <CalendarMonthBox
              key={format(month, 'yyyy-MM')}
              month={month}
              today={today}
              isCurrentMonth={isSameMonth(month, today)}
              tasksByDay={tasksByDay}
              priorityColors={priorityColors}
              onTaskClick={handleTaskClick}
            />
          ))}
        </Box>
      )}

      <Box mt={2} display="flex" gap={2} flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          Legend:
        </Typography>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <Chip
            key={priority}
            label={priority}
            size="small"
            sx={{
              backgroundColor: color + '20',
              borderLeft: `3px solid ${color}`
            }}
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
    </Paper>
  );
}
