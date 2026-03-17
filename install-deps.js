
const { execSync } = require('child_process');
try {
  console.log('Starting npm install...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('npm install finished.');
} catch (error) {
  console.error('npm install failed:', error.message);
  process.exit(1);
}
