import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('Starting test servers...');

// Start server
const server = spawn('npm', ['run', 'dev'], {
  cwd: join(rootDir, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start client
const client = spawn('npm', ['run', 'dev'], {
  cwd: join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  server.kill();
  client.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit();
});