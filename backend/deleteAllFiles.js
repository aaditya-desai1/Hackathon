const fs = require('fs');
const path = require('path');

// Get the uploads directory path
const uploadsDir = path.join(__dirname, 'uploads');

console.log(`Looking for files in: ${uploadsDir}`);

// Check if directory exists
if (fs.existsSync(uploadsDir)) {
  try {
    // Read the directory contents
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files/directories in uploads`);
    
    // Track successful and failed deletions
    let deleted = 0;
    let failed = 0;
    
    // Delete each file
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      
      try {
        // Check if it's a file
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Delete the file
          fs.unlinkSync(filePath);
          console.log(`Deleted: ${filePath}`);
          deleted++;
        } else {
          console.log(`Skipping directory: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error with file ${filePath}:`, err.message);
        failed++;
      }
    }
    
    console.log(`Summary: Deleted ${deleted} files, failed to delete ${failed} files`);
  } catch (err) {
    console.error('Error reading uploads directory:', err);
  }
} else {
  console.log('Uploads directory does not exist');
}

// Also create the directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
} 