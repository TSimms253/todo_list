# Todo App with Schedule Assistant

A modern, full-stack todo application with an intelligent schedule assistant that prioritizes tasks based on urgency and due dates.

## Features

- **Task Management**: Create, update, delete, and organize tasks
- **Priority System**: Urgent, High, Medium, and Low priority levels
- **Status Tracking**: Todo, In Progress, and Completed states
- **Schedule Assistant**: Automatically schedules tasks based on priority and due dates
- **Calendar View**: Visualize scheduled tasks in a weekly calendar
- **XSS Protection**: Built-in sanitization for all user inputs
- **Modern UI**: Material-UI components with skeleton loaders
- **Real-time Updates**: TanStack Query for efficient data fetching and caching

## Tech Stack

### Frontend
- React 18 with TypeScript
- Zustand for state management
- TanStack Query for data fetching
- React Hook Form for form handling
- Material-UI for components
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- Helmet for security headers
- Express Validator for input validation
- DOMPurify for XSS protection

## Project Structure

```
todo_list/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
├── server/                # Backend application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   └── package.json
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Create environment file for the server:
```bash
cd server
cp .env.example .env
```

### Running the Application

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend (port 5000)
npm run dev:server

# Terminal 2 - Frontend (port 3000)
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Building for Production

```bash
npm run build
```

## Usage

### Creating Tasks
1. Click the "+" button to open the task form
2. Fill in task details (title, description, priority, due date, estimated duration)
3. Click "Create Task"

### Scheduling Tasks
1. Select tasks by clicking their checkboxes
2. Click "Schedule Selected"
3. Configure schedule parameters (date range, working hours)
4. Click "Generate Schedule" to auto-schedule based on priorities

### Viewing the Schedule
- Toggle between task list and calendar view using the "Show Calendar" button
- The calendar displays scheduled tasks color-coded by priority

## Security Features

- **XSS Protection**: All user inputs are sanitized on both client and server
- **Input Validation**: Express Validator ensures data integrity
- **Security Headers**: Helmet middleware protects against common vulnerabilities
- **CORS Configuration**: Controlled cross-origin requests

## Best Practices Implemented

- **Functional Components**: All components follow React best practices
- **Single Responsibility**: Each component handles one concern
- **TypeScript**: Full type safety across the application
- **Modern React**: Suspense boundaries and latest hooks
- **Error Handling**: Comprehensive error handling throughout
- **Code Organization**: Clear separation of concerns

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/schedule` - Schedule tasks

## License

ISC
