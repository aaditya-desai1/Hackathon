const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Set environment variables for build
process.env.CI = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

console.log('Starting DataVizPro build process...');

try {
  // Clean build directory
  console.log('Cleaning build directories...');
  fs.emptyDirSync(path.join(__dirname, 'build'));
  fs.emptyDirSync(path.join(__dirname, 'frontend', 'build'));

  // Install dependencies
  console.log('Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });

  // Run the frontend build
  console.log('Building frontend...');
  execSync('cd frontend && npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, CI: 'false', DISABLE_ESLINT_PLUGIN: 'true' }
  });

  // Copy build to root directory
  console.log('Copying build files to root directory...');
  fs.copySync(
    path.join(__dirname, 'frontend', 'build'),
    path.join(__dirname, 'build')
  );

  // Verify build
  const files = fs.readdirSync(path.join(__dirname, 'build'));
  console.log(`Build complete. Build directory contains ${files.length} files/directories:`);
  console.log(files.join(', '));

  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
} 