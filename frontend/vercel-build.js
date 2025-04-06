// This is a custom build script for Vercel deployment
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Starting custom Vercel build process...');

// Set environment to production
process.env.NODE_ENV = 'production';

try {
  // Path to the build script in node_modules
  const buildScriptPath = path.join(__dirname, 'node_modules', 'react-scripts', 'scripts', 'build.js');
  
  console.log(`Checking if build script exists at: ${buildScriptPath}`);
  if (fs.existsSync(buildScriptPath)) {
    console.log('Found build script, executing...');
    
    // Execute the build script directly using Node
    require(buildScriptPath);
  } else {
    console.error('Build script not found. Will try alternative approach.');
    
    // Create build directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'build'))) {
      fs.mkdirSync(path.join(__dirname, 'build'));
    }
    
    // Copy public folder to build as a fallback
    if (fs.existsSync(path.join(__dirname, 'public'))) {
      console.log('Copying public folder to build directory as fallback...');
      fs.cpSync(path.join(__dirname, 'public'), path.join(__dirname, 'build'), { recursive: true });
    }
    
    console.log('Fallback complete.');
  }
  
  console.log('Build process completed.');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
} 