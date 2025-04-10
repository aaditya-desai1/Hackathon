const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const File = require('../models/File');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Use /tmp directory in production (Vercel) environment
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? path.resolve('/tmp') 
      : path.resolve(__dirname, '..', 'uploads');
    
    try {
      await fs.access(uploadDir);
      console.log(`[FileRoutes] Upload directory exists: ${uploadDir}`);
    } catch {
      console.log(`[FileRoutes] Creating upload directory: ${uploadDir}`);
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename while preserving the original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    console.log(`[FileRoutes] Generated filename: ${uniqueSuffix}${ext}`);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check both mimetype and file extension
  const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
  const allowedExtensions = ['.csv', '.json', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  console.log(`[FileRoutes] File upload attempt: ${file.originalname}, mime: ${file.mimetype}, ext: ${ext}`);
  
  if (allowedTypes.includes(file.mimetype) && (allowedExtensions.includes(ext) || ext === '')) {
    cb(null, true);
  } else {
    console.log(`[FileRoutes] Rejected file: ${file.originalname} (type: ${file.mimetype}, ext: ${ext})`);
    cb(new Error(`Invalid file type. Only CSV and JSON files are allowed. Received: ${file.mimetype}, ${ext}`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle file upload errors
const handleFileUpload = (req, res, next) => {
  const uploadSingle = upload.single('file');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('[FileRoutes] Upload middleware error:', err.message);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.error('[FileRoutes] No file was uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`[FileRoutes] File upload successful: ${req.file.originalname}`);
    next();
  });
};

// File upload route - no auth required for testing
router.post('/upload', handleFileUpload, fileController.uploadFile);

// API route to get all files - making this public for testing
router.get('/', fileController.getFiles);

// File operation routes - making these public for testing
router.get('/:id', fileController.getFileById);
router.get('/:id/preview', fileController.getFilePreview);
router.get('/:id/analyze', fileController.analyzeFile);
router.get('/:id/download', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);

// Database cleanup route
router.delete('/cleanup-database', async (req, res) => {
  try {
    console.log('Database cleanup requested from API');
    
    // Delete all file records
    const fileDeleteResult = await File.deleteMany({});
    
    // Get all files in the uploads directory
    const uploadsDir = path.resolve(__dirname, '..', 'uploads');
    try {
      const files = await fs.readdir(uploadsDir);
      
      // Delete each file
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (unlinkError) {
          console.error(`Failed to delete file ${filePath}:`, unlinkError);
        }
      }
    } catch (fsError) {
      console.error('Error accessing uploads directory:', fsError);
    }
    
    // Try to clean up visualizations too if the model exists
    let vizDeleteResult = { deletedCount: 0 };
    try {
      const Visualization = require('../models/Visualization');
      vizDeleteResult = await Visualization.deleteMany({});
    } catch (vizError) {
      console.error('Error deleting visualizations:', vizError);
    }
    
    res.json({
      success: true,
      message: 'Database cleanup completed',
      filesDeleted: fileDeleteResult.deletedCount,
      visualizationsDeleted: vizDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to clean up database' });
  }
});

// Protected routes - require authentication (none left currently, placeholder for future protected routes)
router.use(auth);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('File operation error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          error: 'File size too large. Maximum size is 10MB.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Unexpected field. Please upload a single file with field name "file".' 
        });
      default:
        return res.status(400).json({ 
          error: `File upload error: ${error.message}` 
        });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      error: 'Invalid file type. Only CSV and JSON files are allowed.' 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router; 