require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dataviz-pro';
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    
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

// Delete all records from collections
async function clearDatabase() {
  try {
    // Load models
    const File = require('./models/File');
    const Visualization = require('./models/Visualization');
    
    // Delete all files
    const fileResult = await File.deleteMany({});
    console.log(`Deleted ${fileResult.deletedCount} files from database`);
    
    // Delete all visualizations
    const vizResult = await Visualization.deleteMany({});
    console.log(`Deleted ${vizResult.deletedCount} visualizations from database`);
    
    console.log('Database cleared successfully');
    return true;
  } catch (err) {
    console.error('Error clearing database:', err);
    return false;
  }
}

// Main function
async function main() {
  // Connect to database
  const connected = await connectToDatabase();
  if (!connected) {
    process.exit(1);
  }
  
  // Clear database
  const cleared = await clearDatabase();
  
  // Close connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  
  // Exit with appropriate code
  process.exit(cleared ? 0 : 1);
}

// Run the script
main(); 