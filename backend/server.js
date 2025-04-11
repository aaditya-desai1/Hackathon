require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import routes
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const vizRoutes = require('./routes/visualizationRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

// CORS configuration - allow all origins in production for testing
// Add more specific patterns for Vercel domains
const allowedOrigins = [
  'https://datavizpro-kn4junf9m-aaditya-desais-projects.vercel.app',
  'https://datavizpro-mbgolxqmu7-aaditya-desais-projects.vercel.app', // Current domain
  'https://datavizpro.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      console.log('CORS: No origin in request, allowing');
      return callback(null, true);
    }
    
    // Allow all Vercel app subdomains
    if (allowedOrigins.indexOf(origin) !== -1 || 
        origin.endsWith('.vercel.app') ||
        origin.includes('-aaditya-desais-projects.vercel.app')) {
      console.log('CORS: Allowed origin: ' + origin);
      callback(null, true);
    } else {
      console.log('CORS: Origin not explicitly allowed, but accepting anyway: ' + origin);
      callback(null, true); // Allow all origins for now for troubleshooting
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: false, // Disable credentials for simplicity
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine if we're running on Render
const isRender = process.env.RENDER === 'true';

// Ensure uploads directory exists - Use appropriate path for different environments
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? (isRender ? path.join('/tmp/uploads') : '/tmp') 
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visualizations', vizRoutes);
app.use('/api/data', dataRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: isRender ? 'Render' : 'Other',
    mongodb: mongoose.connection.readyState
  });
});

// Diagnostic route for MongoDB connection
app.get('/api/diagnostics/mongo', async (req, res) => {
  try {
    // Get MongoDB connection status
    const mongoStatus = {
      readyState: mongoose.connection.readyState,
      // Convert readyState to human-readable status
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected',
      environment: process.env.NODE_ENV || 'development',
      platform: isRender ? 'Render' : 'Other'
    };
    
    // Try to perform a simple operation to verify connection
    if (mongoose.connection.readyState === 1) {
      try {
        // Try to fetch a single document from any collection
        const collections = await mongoose.connection.db.listCollections().toArray();
        mongoStatus.collections = collections.map(c => c.name);
        mongoStatus.operationSuccess = true;
      } catch (dbError) {
        mongoStatus.operationSuccess = false;
        mongoStatus.operationError = dbError.message;
      }
    }
    
    res.json({
      success: true,
      mongoStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    environment: process.env.NODE_ENV || 'development',
    platform: isRender ? 'Render' : 'Other',
    mongo_connection: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// Debug route for testing CORS and API connectivity
app.get('/api/debug', (req, res) => {
  // Log all request headers for debugging
  console.log('Debug request headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Debug endpoint working',
    headers: req.headers,
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header',
    host: req.headers.host,
    referer: req.headers.referer || 'No referer',
    cors: {
      enabled: true,
      allowAllOrigins: true
    }
  });
});

// Special non-authenticated debug registration endpoint
app.post('/api/debug/register', (req, res) => {
  console.log('Debug registration request:', req.body);
  console.log('Debug registration headers:', req.headers);
  
  // Return success response without actually creating a user
  res.status(200).json({
    success: true,
    message: 'Debug registration endpoint working',
    receivedData: req.body,
    headers: {
      contentType: req.headers['content-type'],
      origin: req.headers.origin,
      host: req.headers.host
    },
    mockToken: 'debug-jwt-token-' + Date.now()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: `File upload error: ${err.message}`
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate key error',
      details: 'A record with this information already exists'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!'
  });
});

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Connect to MongoDB with improved error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datavizpro';
console.log(`Attempting to connect to MongoDB with ${MONGODB_URI ? 'provided connection string' : 'default localhost connection'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`Platform: ${isRender ? 'Render' : 'Other'}`);

// For serverless environments, we need to handle connections differently
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }

  console.log('Creating new database connection');
  try {
    const conn = await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB successfully');
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error('MongoDB connection error details:', error);
    throw error;
  }
};

// Different connection handling based on environment
if (process.env.NODE_ENV !== 'production' || isRender) {
  // For development or Render (which is not serverless), connect on startup
  connectToDatabase()
    .then(() => {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
} else {
  // In production/Vercel, connect on first request
  app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectToDatabase();
        next();
      } catch (error) {
        console.error('Failed to connect to MongoDB in middleware:', error);
        res.status(500).json({ error: 'Database connection error' });
      }
    } else {
      next();
    }
  });
}

// Export the Express app for serverless usage
module.exports = app; 