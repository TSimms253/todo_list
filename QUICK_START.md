# Quick Start Guide

## Installation & Setup

### Step 1: Install Dependencies

Run this command from the root directory to install all dependencies for both client and server:

```bash
npm run install:all
```

### Step 2: Configure Environment

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
cd ..
```

The default configuration works out of the box:
- Server runs on port 5000
- Client runs on port 3000

### Step 3: Start the Application

From the root directory, run:

```bash
npm run dev
```

This will start both the backend and frontend concurrently.

Wait for both servers to start, then open your browser to:
**http://localhost:3000**

## Using the App

### Creating Your First Task

1. Click the floating **+** button in the bottom-right corner
2. Fill in the form:
   - **Title**: "Complete project documentation" (required)
   - **Description**: Add details about the task
   - **Priority**: Choose from Low, Medium, High, or Urgent
   - **Due Date**: Optional - when the task should be completed
   - **Estimated Duration**: Optional - how many minutes the task will take
3. Click **Create Task**

### Managing Tasks

- **Change Status**: Click the status chip (todo → in_progress → completed)
- **Delete Task**: Click the trash icon
- **Select Tasks**: Click the checkbox to select for scheduling

### Using the Schedule Assistant

1. Select multiple tasks using the checkboxes
2. Click **Schedule Selected** button
3. Configure the schedule:
   - **Start Date**: When to begin scheduling
   - **End Date**: Scheduling deadline
   - **Working Hours**: Set your daily work schedule (e.g., 9 AM - 5 PM)
4. Click **Generate Schedule**

The algorithm will automatically schedule tasks based on:
- Priority (Urgent > High > Medium > Low)
- Due dates (closer dates get higher priority)
- Estimated duration
- Available working hours

### Viewing Your Schedule

1. Click **Show Calendar** in the top-right
2. View your scheduled tasks for the week
3. Tasks are color-coded by priority:
   - **Red**: Urgent
   - **Orange**: High
   - **Blue**: Medium
   - **Gray**: Low

## Features Demonstrated

### Security (XSS Protection)
- Try entering HTML/JavaScript in task fields - it will be sanitized
- All inputs are validated on both client and server

### Modern React Features
- Notice the skeleton loaders while data loads (Suspense)
- Form validation with React Hook Form
- Smooth state management with Zustand
- Efficient data fetching with TanStack Query

### Best Practices
- Each component has a single responsibility
- Functional components throughout
- TypeScript for type safety
- Proper error handling

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

1. Change the server port in `server/.env`:
   ```
   PORT=5001
   ```

2. Update the client proxy in `client/vite.config.ts`:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:5001',
       changeOrigin: true
     }
   }
   ```

### Dependencies Not Installing

Run installations separately:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install
cd ..

# Client dependencies
cd client
npm install
cd ..
```

## Next Steps

1. Explore the code structure in the README.md
2. Try creating tasks with different priorities
3. Use the schedule assistant to see the priority-based algorithm in action
4. Check the calendar view to see your scheduled tasks

Enjoy using the Todo App!
