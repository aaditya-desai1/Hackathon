// This is a custom build script for Vercel deployment
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

console.log('Starting custom Vercel build process...');

// Set environment to production
process.env.NODE_ENV = 'production';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';

try {
  // Ensure the build directory exists
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    console.log('Creating build directory...');
    fs.mkdirSync(buildDir, { recursive: true });
  }

  console.log('Building the React application...');
  try {
    // Try to run the build command directly
    console.log('Executing npm run build...');
    execSync('npm run build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DISABLE_ESLINT_PLUGIN: 'true',
        CI: 'false'
      }
    });
    console.log('Build completed successfully using npm run build.');
  } catch (buildError) {
    console.error('Error running build command:', buildError);
    
    console.log('Attempting alternative build method...');
    // Path to the build script in node_modules
    const buildScriptPath = path.join(__dirname, 'node_modules', 'react-scripts', 'scripts', 'build.js');
    
    if (fs.existsSync(buildScriptPath)) {
      console.log(`Found build script at: ${buildScriptPath}`);
      // Execute the build script directly using Node
      try {
        require(buildScriptPath);
        console.log('Build completed successfully using direct script execution.');
      } catch (directError) {
        console.error('Error running direct build script:', directError);
        throw directError;
      }
    } else {
      console.error('Build script not found. Falling back to copying public folder.');
      
      // Copy public folder to build as a fallback
      if (fs.existsSync(path.join(__dirname, 'public'))) {
        console.log('Copying public folder to build directory as fallback...');
        fs.copySync(path.join(__dirname, 'public'), buildDir);
        
        // Create a basic index.js in the build folder
        const indexJsContent = `
          document.addEventListener('DOMContentLoaded', function() {
            document.body.innerHTML += '<div style="text-align:center;margin-top:50px;"><h1>DataVizPro</h1><p>Build process did not complete successfully. Please check the deployment logs.</p></div>';
          });
        `;
        fs.writeFileSync(path.join(buildDir, 'index.js'), indexJsContent);
        console.log('Fallback complete. Created basic index.js file.');
      } else {
        throw new Error('Cannot find public directory for fallback!');
      }
    }
  }
  
  // Verify the build directory has content
  const files = fs.readdirSync(buildDir);
  console.log(`Build directory contains ${files.length} files/directories:`);
  console.log(files.join(', '));
  
  if (files.length === 0) {
    throw new Error('Build directory is empty! Deployment will fail.');
  }
  
  if (!files.includes('index.html')) {
    console.warn('Warning: index.html not found in build directory!');
  }
  
  console.log('Build process completed. Ready for deployment.');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
} 