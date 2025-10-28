import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { setHours, setMinutes } from 'date-fns';
import { CreateTaskDto, TaskPriority } from '../types/task.types';
import { sanitizeText } from '../utils/sanitize';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto) => void;
  isSubmitting?: boolean;
}

interface FormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: Date | null;
  dueTime: Date | null;
  estimatedDuration: number | '';
}

/**
 * Task creation form component
 * Uses React Hook Form for form state management and validation
 * Single responsibility: Handle task form input and validation
 */
export function TaskForm({ open, onClose, onSubmit, isSubmitting = false }: TaskFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: null,
      dueTime: null,
      estimatedDuration: ''
    }
  });

  const dueDate = watch('dueDate');

  const handleFormSubmit = (data: FormData) => {
    // Combine date and time into a single Date object
    let combinedDueDate: Date | undefined = undefined;
    if (data.dueDate) {
      if (data.dueTime) {
        // Combine the date with the selected time
        combinedDueDate = setHours(
          setMinutes(data.dueDate, data.dueTime.getMinutes()),
          data.dueTime.getHours()
        );
      } else {
        // If no time selected, use the date as-is
        combinedDueDate = data.dueDate;
      }
    }

    // Sanitize text inputs to prevent XSS
    const sanitizedData: CreateTaskDto = {
      title: sanitizeText(data.title),
      description: sanitizeText(data.description),
      priority: data.priority,
      dueDate: combinedDueDate ? combinedDueDate.toISOString() : undefined,
      estimatedDuration: data.estimatedDuration ? Number(data.estimatedDuration) : undefined
    };

    onSubmit(sanitizedData);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Controller
            name="title"
            control={control}
            rules={{
              required: 'Title is required',
              maxLength: {
                value: 200,
                message: 'Title must not exceed 200 characters'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Title"
                fullWidth
                margin="normal"
                error={!!errors.title}
                helperText={errors.title?.message}
                autoFocus
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            rules={{
              maxLength: {
                value: 1000,
                message: 'Description must not exceed 1000 characters'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                multiline
                rows={4}
                margin="normal"
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select {...field} label="Priority">
                  <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                  <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                  <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Due Date (Optional)"
                  slotProps={{
                    textField: {
                      placeholder: '',
                      fullWidth: true,
                      margin: 'normal'
                    }
                  }}
                />
              )}
            />

            <Controller
              name="dueTime"
              control={control}
              render={({ field }) => (
                <TimePicker
                  {...field}
                  label="Due Time (Optional)"
                  disabled={!dueDate}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock
                  }}
                  slotProps={{
                    textField: {
                      placeholder: '',
                      fullWidth: true,
                      margin: 'normal',
                      helperText: !dueDate ? 'Select a date first' : ''
                    }
                  }}
                />
              )}
            />
          </LocalizationProvider>

          <Controller
            name="estimatedDuration"
            control={control}
            rules={{
              min: {
                value: 1,
                message: 'Duration must be at least 1 minute'
              },
              max: {
                value: 1440,
                message: 'Duration must not exceed 1440 minutes (24 hours)'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Estimated Duration (minutes)"
                type="number"
                fullWidth
                margin="normal"
                error={!!errors.estimatedDuration}
                helperText={errors.estimatedDuration?.message}
              />
            )}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Create Task
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
