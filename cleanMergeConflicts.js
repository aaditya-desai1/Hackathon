const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Let's find files with merge conflicts
console.log('Searching for files with merge conflicts...');
let filesToClean = [];

try {
  // Use grep to find files with merge conflicts
  const grepResult = execSync('findstr /S "<<<<<<< HEAD" *.* frontend\\*.* frontend\\src\\*.*').toString();
  const lines = grepResult.split('\n');
  
  // Extract filenames from grep results
  lines.forEach(line => {
    if (line.trim()) {
      const filePath = line.split(':')[0];
      if (!filesToClean.includes(filePath)) {
        filesToClean.push(filePath);
      }
    }
  });
} catch (error) {
  console.log('Error searching for files, using default list:', error.message);
  
  // Default list if grep fails
  filesToClean = [
    './frontend/src/pages/Visualizations.js',
    './frontend/src/utils/chartUtils.js',
    './frontend/src/services/api.js'
  ];
}

console.log('Files to clean:', filesToClean);

// Process each file
filesToClean.forEach(filePath => {
  try {
    console.log(`Processing ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

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
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err);
  }
});

console.log('Merge conflict cleanup completed.'); 