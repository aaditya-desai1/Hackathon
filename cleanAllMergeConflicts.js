const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively get all files with a specific extension from a directory
function getAllFiles(dirPath, extensions, fileList = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, extensions, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Process a file to clean merge conflicts (keeping the HEAD version)
function processMergeConflicts(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file has merge conflicts
    if (!content.includes('<<<<<<< HEAD')) {
      console.log(`  No merge conflicts found in ${filePath}`);
      return false;
    }

    // Remove merge conflict markers and their sections
    // This will keep "HEAD" version (our changes)
    let cleanedContent = '';
    let inConflict = false;
    let keepingHead = false;

    // Split by lines
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('<<<<<<< HEAD')) {
        inConflict = true;
        keepingHead = true;
        continue;
      } 
      else if (line.includes('=======')) {
        keepingHead = false;
        continue;
      } 
      else if (line.includes('>>>>>>>')) {
        inConflict = false;
        continue;
      }
      
      // Only include lines when not in conflict or when keeping HEAD version
      if (!inConflict || keepingHead) {
        cleanedContent += line + '\n';
      }
    }

    // Write cleaned content back to file
    fs.writeFileSync(filePath, cleanedContent);
    console.log(`✅ Cleaned merge conflicts in ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err);
    return false;
  }
}

// Main function
function cleanAllMergeConflicts() {
  console.log('🔎 Searching for files with potential merge conflicts...');
  
  // Known files with merge conflicts
  const knownConflictFiles = [
    './frontend/src/index.js',
    './frontend/src/App.js',
    './frontend/src/pages/Home.js',
    './frontend/src/pages/FileManager.js',
    './frontend/src/pages/Dashboard.js',
    './frontend/src/pages/Visualizations.js',
    './frontend/src/utils/chartUtils.js',
    './frontend/package.json',
    './package.json',
    './vercel.json'
  ];
  
  // Get all JS and JSON files in the frontend directory
  const frontendPath = path.join(__dirname, 'frontend');
  let allFiles = getAllFiles(frontendPath, ['.js', '.json']);
  
  // Also check root package.json and vercel.json
  allFiles.push(path.join(__dirname, 'package.json'));
  allFiles.push(path.join(__dirname, 'vercel.json'));
  
  // Add known conflict files that might not be found by the getAllFiles function
  knownConflictFiles.forEach(file => {
    const absolutePath = path.join(__dirname, file.replace('./', ''));
    if (!allFiles.includes(absolutePath) && fs.existsSync(absolutePath)) {
      allFiles.push(absolutePath);
    }
  });
  
  console.log(`Found ${allFiles.length} files to check for merge conflicts`);
  
  // Process each file
  let cleanedCount = 0;
  allFiles.forEach(file => {
    if (processMergeConflicts(file)) {
      cleanedCount++;
    }
  });
  
  console.log(`\n✅ Completed! Cleaned merge conflicts in ${cleanedCount} files`);
}

// Run the main function
cleanAllMergeConflicts(); 