const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const File = require('./models/File');

// Connect to MongoDB
async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dataviz');
    console.log('Connected to MongoDB');
    
    // Path to uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Step 1: List all files in the uploads directory
    let physicalFiles = [];
    try {
      const files = await fs.readdir(uploadsDir);
      physicalFiles = files.map(file => path.join(uploadsDir, file));
      console.log(`Found ${physicalFiles.length} physical files in the uploads directory`);
    } catch (err) {
      console.log('No uploads directory or error reading it:', err.message);
      // Create uploads directory if it doesn't exist
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
      } catch (mkdirErr) {
        console.error('Failed to create uploads directory:', mkdirErr);
      }
    }
    
    // Step 2: Get all file records from the database
    const dbFiles = await File.find();
    console.log(`Found ${dbFiles.length} file records in the database`);
    
    // Step 3: Delete all database records
    if (dbFiles.length > 0) {
      const result = await File.deleteMany({});
      console.log(`Deleted ${result.deletedCount} file records from the database`);
    }
    
    // Step 4: Delete all physical files in the uploads directory
    for (const filePath of physicalFiles) {
      try {
        await fs.unlink(filePath);
        console.log(`Deleted physical file: ${filePath}`);
      } catch (err) {
        console.error(`Failed to delete file ${filePath}:`, err.message);
      }
    }
    
    console.log('Reset completed successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main(); 