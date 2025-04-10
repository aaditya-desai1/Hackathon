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
const dataRoutes = require('./routes/dataRoutes');
const visualizationRoutes = require('./routes/visualizationRoutes');

const app = express();

// CORS configuration - allow all origins in production
const corsOptions = {
  origin: true, // Allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists - use /tmp in production (Vercel)
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/visualizations', visualizationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    environment: process.env.NODE_ENV || 'development',
    mongo_connection: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
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

// Connect to MongoDB with improved error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datavizpro';
console.log(`Attempting to connect to MongoDB with ${MONGODB_URI ? 'provided connection string' : 'default localhost connection'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error details:', error);
    // Don't exit in production - just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }); 