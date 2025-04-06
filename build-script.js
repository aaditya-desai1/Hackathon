const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Set production environment
process.env.NODE_ENV = 'production';

// Change to frontend directory if not already there
const frontendDir = path.join(__dirname, 'frontend');
if (process.cwd() !== frontendDir) {
  process.chdir(frontendDir);
}

console.log('Starting build process...');
console.log('Current directory:', process.cwd());

// Direct path to the build.js script
const buildScriptPath = path.join(process.cwd(), 'node_modules', 'react-scripts', 'scripts', 'build.js');

// Check if the build script exists
if (!fs.existsSync(buildScriptPath)) {
  console.error(`Build script not found: ${buildScriptPath}`);
  process.exit(1);
}

// Execute the build script directly
try {
  console.log(`Executing: node ${buildScriptPath}`);
  
  const buildProcess = spawn('node', [buildScriptPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Build process exited with code ${code}`);
      process.exit(code);
    }
    console.log('Build completed successfully');
  });
} catch (error) {
  console.error('Error executing build script:', error);
  process.exit(1);
} 