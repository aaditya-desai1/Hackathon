require('dotenv').config();
const mongoose = require('mongoose');

console.log('Starting MongoDB connection test...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment variables loaded:', Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB')));

// Define test function
async function testDbConnection() {
  console.log('Testing MongoDB connection...');
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
  
  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Check MongoDB connection state
    const state = mongoose.connection.readyState;
    console.log(`MongoDB connection state: ${state} (${['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown'})`);
    
    // Try to access User collection
    console.log('Listing collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    const hasUsersCollection = collections.some(c => c.name === 'users');
    if (hasUsersCollection) {
      console.log('Users collection found! Checking for users...');
      
      // Count users
      const User = mongoose.model('User', new mongoose.Schema({
        username: String,
        email: String,
        password: String,
        role: String,
        isActive: Boolean
      }));
      
      const userCount = await User.countDocuments();
      console.log(`Found ${userCount} users in the database`);
      
      if (userCount > 0) {
        // Show a sample user (without password)
        const sampleUser = await User.findOne().select('-password');
        console.log('Sample user:', sampleUser ? JSON.stringify(sampleUser.toJSON(), null, 2) : 'None found');
      }
    } else {
      console.log('No users collection found. You may need to create a user first.');
    }
    
    console.log('Database test completed successfully.');
  } catch (error) {
    console.error('Database connection or test failed:', error);
  } finally {
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
console.log('About to run the test function...');
testDbConnection()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 