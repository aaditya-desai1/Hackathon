// Custom Vercel build script for DataVizPro
const path = require('path');
const fs = require('fs-extra');

console.log('Starting Vercel deployment post-build process...');

// Paths
const frontendBuildDir = path.join(__dirname, 'build');
const rootBuildDir = path.join(__dirname, '..', 'build');

try {
  // Verify that we have a build
  if (!fs.existsSync(frontendBuildDir) || !fs.statSync(frontendBuildDir).isDirectory()) {
    console.error('Build directory does not exist:', frontendBuildDir);
    // Create it if it doesn't exist
    fs.ensureDirSync(frontendBuildDir);
  }
  
  // List contents of the frontend build directory
  const frontendBuildFiles = fs.readdirSync(frontendBuildDir);
  console.log(`Frontend build directory contains ${frontendBuildFiles.length} files/directories:`);
  if (frontendBuildFiles.length > 0) {
    console.log(frontendBuildFiles.join(', '));
  } else {
    console.warn('WARNING: Frontend build directory is empty!');
  }
  
  // Ensure root build directory exists
  fs.ensureDirSync(rootBuildDir);
  
  // Copy files from frontend build to root build
  console.log('Copying build files to root directory...');
  fs.copySync(frontendBuildDir, rootBuildDir);
  
  // Verify copy was successful
  const rootBuildFiles = fs.readdirSync(rootBuildDir);
  console.log(`Root build directory now contains ${rootBuildFiles.length} files/directories.`);
  
  // Add build info file
  fs.writeFileSync(
    path.join(rootBuildDir, 'build-info.json'), 
    JSON.stringify({
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercel: true
    }, null, 2)
  );
  
  console.log('Vercel deployment post-build process completed successfully.');
} catch (error) {
  console.error('Error in Vercel post-build process:', error);
  
  // Create fallback content if needed
  if (!fs.existsSync(path.join(rootBuildDir, 'index.html'))) {
    console.log('Creating fallback content...');
    
    // Create minimal index.html
    const fallbackHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DataVizPro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
          .container { background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 2rem; max-width: 600px; text-align: center; }
          h1 { color: #1976d2; }
          button { background-color: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DataVizPro</h1>
          <p>Your ultimate data visualization solution</p>
          <p>We're currently experiencing technical difficulties. Please try again later.</p>
          <button onclick="window.location.reload()">Refresh Page</button>
        </div>
      </body>
      </html>
    `;
    
    fs.ensureDirSync(rootBuildDir);
    fs.writeFileSync(path.join(rootBuildDir, 'index.html'), fallbackHtml);
  }
} 