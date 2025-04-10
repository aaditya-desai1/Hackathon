require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const File = require('./models/File');
const Visualization = require('./models/Visualization');

// Get upload directory path based on environment
const getUploadDir = () => {
  return process.env.NODE_ENV === 'production'
    ? '/tmp'
    : path.resolve(__dirname, 'uploads');
};

// Connection to MongoDB
const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/dataviz-pro';
    console.log(`Connecting to MongoDB: ${connectionString}`);
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Cleanup database function
const cleanupDatabase = async () => {
  try {
    console.log('Starting database cleanup...');
    
    // Get all files before deleting from database
    const allFiles = await File.find({});
    console.log(`Found ${allFiles.length} files in database`);
    
    // Delete files from MongoDB first
    const fileDeleteResult = await File.deleteMany({});
    console.log(`Deleted ${fileDeleteResult.deletedCount} files from database`);
    
    // Delete visualizations from MongoDB
    const vizDeleteResult = await Visualization.deleteMany({});
    console.log(`Deleted ${vizDeleteResult.deletedCount} visualizations from database`);
    
    // Results for disk deletion
    const diskResults = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Now try to clean any files from disk
    try {
      // Primary approach: use the uploads directory and delete all files there
      const uploadDir = getUploadDir();
      console.log(`Cleaning up files from ${uploadDir}...`);
      
      if (fs.existsSync(uploadDir)) {
        // List all files in the uploads directory
        const files = fs.readdirSync(uploadDir);
        console.log(`Found ${files.length} files in upload directory`);
        
        // Delete each file in the directory
        for (const file of files) {
          try {
            const filePath = path.join(uploadDir, file);
            
            // Skip over directories and only delete files
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
              diskResults.success++;
            }
          } catch (err) {
            console.error(`Error deleting file ${file}:`, err);
            diskResults.failed++;
            diskResults.errors.push(`Error deleting ${file}: ${err.message}`);
            // Continue with other files
          }
        }
      } else {
        console.log(`Upload directory ${uploadDir} not found`);
      }
    } catch (err) {
      console.error('Error cleaning up upload directory:', err);
      diskResults.failed++;
      diskResults.errors.push(`Error accessing upload directory: ${err.message}`);
    }
    
    console.log('Database cleanup completed');
    console.log('Results:', {
      filesDeleted: fileDeleteResult.deletedCount,
      visualizationsDeleted: vizDeleteResult.deletedCount,
      diskDeleteSuccess: diskResults.success,
      diskDeleteFailed: diskResults.failed
    });
    
    return {
      success: true,
      filesDeleted: fileDeleteResult.deletedCount,
      visualizationsDeleted: vizDeleteResult.deletedCount,
      diskResults
    };
  } catch (err) {
    console.error('Error during database cleanup:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// Run the script directly or export for API use
if (require.main === module) {
  // Run as a standalone script
  connectDB()
    .then(async () => {
      const results = await cleanupDatabase();
      console.log('Cleanup results:', results);
      process.exit(0);
    })
    .catch(err => {
      console.error('Cleanup failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in API routes
  module.exports = {
    cleanupDatabase
  };
} 