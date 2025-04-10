require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Get the MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dataviz-pro';

// Get uploads directory path
const getUploadsDir = () => {
  return process.env.NODE_ENV === 'production'
    ? '/tmp'
    : path.join(__dirname, 'uploads');
};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}...`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    return false;
  }
}

// Clear all database collections
async function clearDatabase() {
  try {
    // Load models
    const File = require('./models/File');
    const Visualization = require('./models/Visualization');
    
    // Delete all files
    const filesResult = await File.deleteMany({});
    console.log(`✓ Deleted ${filesResult.deletedCount} files from database`);
    
    // Delete all visualizations
    const vizResult = await Visualization.deleteMany({});
    console.log(`✓ Deleted ${vizResult.deletedCount} visualizations from database`);
    
    return {
      success: true,
      deletedFiles: filesResult.deletedCount,
      deletedVisualizations: vizResult.deletedCount
    };
  } catch (err) {
    console.error('Error clearing database:', err);
    return { success: false, error: err.message };
  }
}

// Reset the uploads directory
function resetUploadsDirectory() {
  try {
    const uploadsDir = getUploadsDir();
    console.log(`Working with uploads directory: ${uploadsDir}`);
    
    // Check if directory exists
    if (fs.existsSync(uploadsDir)) {
      console.log('Uploads directory exists - cleaning up files...');
      
      // Get all files in directory
      const files = fs.readdirSync(uploadsDir);
      console.log(`Found ${files.length} items in uploads directory`);
      
      // Delete each file
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const file of files) {
        try {
          const filePath = path.join(uploadsDir, file);
          
          // Check if it's a file
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch (err) {
          console.error(`Error deleting file ${file}:`, err.message);
          errorCount++;
        }
      }
      
      console.log(`✓ Deleted ${deletedCount} files from uploads directory`);
      if (errorCount > 0) {
        console.log(`⚠ Failed to delete ${errorCount} files`);
      }
    } else {
      console.log('Uploads directory does not exist - creating it...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✓ Created uploads directory: ${uploadsDir}`);
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error resetting uploads directory:', err);
    return { success: false, error: err.message };
  }
}

// Main function to reset everything
async function resetEverything() {
  console.log('===== STARTING DATABASE & FILES RESET =====');
  
  // Connect to database
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.error('⛔ Database connection failed - aborting');
    return { success: false, error: 'Database connection failed' };
  }
  
  // Clear database
  const dbResult = await clearDatabase();
  if (!dbResult.success) {
    console.error('⛔ Database cleanup failed');
  }
  
  // Reset uploads directory
  const dirResult = resetUploadsDirectory();
  if (!dirResult.success) {
    console.error('⛔ Uploads directory reset failed');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Reconnect to MongoDB (important to restore connection for future operations)
  console.log('Reconnecting to MongoDB...');
  await connectToDatabase();
  
  console.log('===== RESET COMPLETED =====');
  
  return {
    success: dbResult.success && dirResult.success,
    databaseResult: dbResult,
    directoryResult: dirResult
  };
}

// Run the script directly
if (require.main === module) {
  resetEverything()
    .then(result => {
      console.log('Reset result:', result.success ? 'SUCCESS' : 'FAILED');
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error during reset:', err);
      process.exit(1);
    });
} else {
  // Export for API usage
  module.exports = { resetEverything };
} 