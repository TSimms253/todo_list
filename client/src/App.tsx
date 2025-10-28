import { Suspense, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Paper,
  Skeleton,
  Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Calendar } from './components/Calendar';
import { ScheduleAssistant } from './components/ScheduleAssistant';
import { useTasks, useCreateTask } from './hooks/useTasks';
import { useTaskStore } from './store/taskStore';
import { CreateTaskDto } from './types/task.types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

/**
 * Main content component with Suspense boundary
 */
function AppContent() {
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [scheduleAssistantOpen, setScheduleAssistantOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: tasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const { selectedTaskIds, clearSelection } = useTaskStore();

  const handleCreateTask = async (taskData: CreateTaskDto) => {
    await createTaskMutation.mutateAsync(taskData);
    setTaskFormOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Todo List
          </Typography>
          <Button
            color="inherit"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {showCalendar ? 'Show Tasks' : 'Show Calendar'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {showCalendar ? 'Schedule' : 'My Tasks'}
          </Typography>
          {!showCalendar && selectedTaskIds.length > 0 && (
            <Box display="flex" gap={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {selectedTaskIds.length} selected
              </Typography>
              <Button
                variant="outlined"
                onClick={() => clearSelection()}
              >
                Clear Selection
              </Button>
              <Button
                variant="contained"
                onClick={() => setScheduleAssistantOpen(true)}
              >
                Schedule Selected
              </Button>
            </Box>
          )}
        </Box>

        {showCalendar ? (
          <Suspense fallback={<Skeleton variant="rectangular" height={400} />}>
            <Calendar tasks={tasks} />
          </Suspense>
        ) : (
          <Suspense fallback={<TaskListSkeleton />}>
            <TaskList tasks={tasks} isLoading={isLoading} />
          </Suspense>
        )}

        {!showCalendar && (
          <Fab
            color="primary"
            aria-label="add task"
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={() => setTaskFormOpen(true)}
          >
            <AddIcon />
          </Fab>
        )}

        <TaskForm
          open={taskFormOpen}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={handleCreateTask}
          isSubmitting={createTaskMutation.isPending}
        />

        <ScheduleAssistant
          open={scheduleAssistantOpen}
          onClose={() => setScheduleAssistantOpen(false)}
        />
      </Container>
    </Box>
  );
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
 * Root App component with providers
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
