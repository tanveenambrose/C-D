
const { spawn } = require('child_process');
const path = require('path');

const nextPath = path.resolve('node_modules', 'next', 'dist', 'bin', 'next');
console.log(`Running next from: ${nextPath}`);

const child = spawn('node', [nextPath, 'dev'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start child process:', err);
});

child.on('exit', (code) => {
  console.log(`Child process exited with code ${code}`);
});
