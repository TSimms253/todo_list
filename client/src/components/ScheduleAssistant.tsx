import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useScheduleTasks } from '../hooks/useTasks';
import { useTaskStore } from '../store/taskStore';

interface ScheduleAssistantProps {
  open: boolean;
  onClose: () => void;
}

interface ScheduleFormData {
  startDate: Date | null;
  endDate: Date | null;
  workingHoursStart: number;
  workingHoursEnd: number;
}

/**
 * Schedule assistant dialog component
 * Single responsibility: Handle scheduling configuration and trigger schedule generation
 */
export function ScheduleAssistant({ open, onClose }: ScheduleAssistantProps) {
  const { selectedTaskIds, clearSelection } = useTaskStore();
  const scheduleTasksMutation = useScheduleTasks();
  const [error, setError] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ScheduleFormData>({
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      workingHoursStart: 9,
      workingHoursEnd: 17
    }
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const onSubmit = async (data: ScheduleFormData) => {
    if (!data.startDate || !data.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (data.startDate >= data.endDate) {
      setError('End date must be after start date');
      return;
    }

    if (data.workingHoursStart >= data.workingHoursEnd) {
      setError('Working hours end must be after working hours start');
      return;
    }

    if (selectedTaskIds.length === 0) {
      setError('Please select at least one task to schedule');
      return;
    }

    try {
      await scheduleTasksMutation.mutateAsync({
        taskIds: selectedTaskIds,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        workingHoursStart: data.workingHoursStart,
        workingHoursEnd: data.workingHoursEnd
      });

      clearSelection();
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule tasks');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule Assistant</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Selected tasks: {selectedTaskIds.length}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name="startDate"
              control={control}
              rules={{ required: 'Start date is required' }}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Start Date"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      error: !!errors.startDate,
                      helperText: errors.startDate?.message
                    }
                  }}
                />
              )}
            />

            <Controller
              name="endDate"
              control={control}
              rules={{ required: 'End date is required' }}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="End Date"
                  minDate={startDate || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      error: !!errors.endDate,
                      helperText: errors.endDate?.message
                    }
                  }}
                />
              )}
            />
          </LocalizationProvider>

          <Box display="flex" gap={2} mt={2}>
            <Controller
              name="workingHoursStart"
              control={control}
              rules={{
                required: 'Working hours start is required',
                min: { value: 0, message: 'Must be between 0 and 23' },
                max: { value: 23, message: 'Must be between 0 and 23' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Working Hours Start (0-23)"
                  type="number"
                  fullWidth
                  error={!!errors.workingHoursStart}
                  helperText={errors.workingHoursStart?.message}
                />
              )}
            />

            <Controller
              name="workingHoursEnd"
              control={control}
              rules={{
                required: 'Working hours end is required',
                min: { value: 1, message: 'Must be between 1 and 24' },
                max: { value: 24, message: 'Must be between 1 and 24' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Working Hours End (1-24)"
                  type="number"
                  fullWidth
                  error={!!errors.workingHoursEnd}
                  helperText={errors.workingHoursEnd?.message}
                />
              )}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Tasks will be scheduled based on priority (Urgent → High → Medium → Low) and due dates.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={scheduleTasksMutation.isPending}
          >
            Generate Schedule
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
