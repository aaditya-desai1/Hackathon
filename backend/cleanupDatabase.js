require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const File = require('./models/File');
const Visualization = require('./models/Visualization');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datavizpro';
console.log(`Attempting to connect to MongoDB with ${MONGODB_URI ? 'provided connection string' : 'default localhost connection'}`);

// Main cleanup function
async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Connect to the database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Get all files in the database
    const files = await File.find({});
    console.log(`Found ${files.length} files in the database`);
    
    // Delete all physical files first
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      // Check if uploads directory exists
      await fs.access(uploadsDir);
      
      // Get list of files in uploads directory
      const uploadedFiles = await fs.readdir(uploadsDir);
      console.log(`Found ${uploadedFiles.length} files in uploads directory`);
      
      // Delete each file
      for (const filename of uploadedFiles) {
        const filePath = path.join(uploadsDir, filename);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error.message);
        }
      }
    } catch (error) {
      console.log('No uploads directory found or could not access it:', error.message);
    }
    
    // Delete all visualizations from the database
    try {
      const vizDeleteResult = await Visualization.deleteMany({});
      console.log(`Deleted ${vizDeleteResult.deletedCount} visualizations from the database`);
    } catch (error) {
      console.log('No visualizations found or error deleting them:', error.message);
    }
    
    // Delete all files from the database
    const deleteResult = await File.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} files from the database`);
    
    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup function
cleanupDatabase(); 