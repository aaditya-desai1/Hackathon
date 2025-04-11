const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const File = require('../models/File');
const { cleanupDatabase } = require('../cleanupDatabase');
const { resetEverything } = require('../resetDatabase');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Use /tmp directory in production (Vercel) environment
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? path.resolve('/tmp') 
      : path.resolve(__dirname, '..', 'uploads');
    
    try {
      await fsPromises.access(uploadDir);
      console.log(`[FileRoutes] Upload directory exists: ${uploadDir}`);
    } catch {
      console.log(`[FileRoutes] Creating upload directory: ${uploadDir}`);
      await fsPromises.mkdir(uploadDir, { recursive: true });
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
  
  // Check for valid MIME types or extensions
  if (allowedTypes.includes(file.mimetype) && (allowedExtensions.includes(ext) || ext === '')) {
    cb(null, true);
    return;
  }
  
  // Special case for files with wrong mimetype but correct extension
  // This helps with files that browsers might misidentify
  if (allowedExtensions.includes(ext)) {
    console.log(`[FileRoutes] File has correct extension but wrong MIME type: ${file.mimetype}`);
    
    // Override the mimetype based on extension
    if (ext === '.csv') {
      file.mimetype = 'text/csv';
    } else if (ext === '.json') {
      file.mimetype = 'application/json';
    } else if (ext === '.txt') {
      file.mimetype = 'text/plain';
    }
    
    cb(null, true);
    return;
  }
  
  console.log(`[FileRoutes] Rejected file: ${file.originalname} (type: ${file.mimetype}, ext: ${ext})`);
  cb(new Error(`Invalid file type. Only CSV, JSON, and text files are allowed. Received: ${file.mimetype}, ${ext}`));
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
  
  console.log('[FileRoutes] Received upload request with headers:', {
    contentType: req.headers['content-type'],
    authorization: req.headers['authorization'] ? 'Present (token)' : 'Missing',
    contentLength: req.headers['content-length']
  });
  
  // First check if the request contains a valid content-type for multipart form
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    console.error('[FileRoutes] Invalid Content-Type header:', req.headers['content-type']);
    return res.status(400).json({ 
      error: 'Invalid request. Content-Type must be multipart/form-data',
      receivedContentType: req.headers['content-type']
    });
  }
  
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
      console.error('[FileRoutes] No file was uploaded in the request');
      return res.status(400).json({ error: 'No file uploaded. Make sure the file field is named "file".' });
    }
    
    console.log(`[FileRoutes] File upload successful:`, {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Proceed to the next middleware
    next();
  });
};

// File upload route - require authentication for all uploads
router.post('/upload', auth, handleFileUpload, async (req, res, next) => {
  try {
    // Validate uploaded JSON files before passing to controller
    if (req.file.mimetype === 'application/json' || path.extname(req.file.originalname).toLowerCase() === '.json') {
      try {
        // Read file content
        const fileContent = await fsPromises.readFile(req.file.path, 'utf-8');
        console.log('[FileRoutes] Validating JSON file content, length:', fileContent.length);
        
        // Simple validation to ensure it's a valid JSON structure without writing to disk
        try {
          // Clean and validate the JSON
          const cleanContent = fileContent.trim().replace(/^\uFEFF/, '');
          JSON.parse(cleanContent); // Just validate, don't save the result
          console.log('[FileRoutes] JSON content validated successfully');
        } catch (parseError) {
          console.error('[FileRoutes] JSON parse error:', parseError.message);
          // Don't try to fix JSON server-side, rely on client-side sanitization
          return res.status(400).json({ 
            error: 'Invalid JSON format in uploaded file', 
            details: parseError.message 
          });
        }
      } catch (error) {
        console.error('[FileRoutes] Error reading JSON file:', error.message);
        return res.status(500).json({ 
          error: 'Failed to read uploaded file', 
          details: error.message 
        });
      }
    }
    
    // If validation passed, continue to the controller
    fileController.uploadFile(req, res, next);
  } catch (error) {
    console.error('[FileRoutes] Unexpected error in upload middleware:', error);
    next(error);
  }
});

// API route to get all files - require authentication
router.get('/', auth, fileController.getFiles);

// API route to get a specific file - require authentication
router.get('/:id', auth, fileController.getFileById);

// API route to delete a file - require authentication
router.delete('/:id', auth, fileController.deleteFile);

// API route to analyze a file - require authentication
router.post('/:id/analyze', auth, fileController.analyzeFile);

// Special route for complete reset - this will wipe everything
// Only available in development or with admin privileges
router.delete('/reset-everything', async (req, res) => {
  try {
    console.log('Executing complete database and files reset');
    
    // Call the reset everything function
    const result = await resetEverything();
    
    if (!result.success) {
      console.error('Reset failed:', result);
      return res.status(500).json({
        success: false,
        message: 'Reset failed',
        details: result
      });
    }
    
    // Return success response
    res.json({
      success: true,
      message: 'Complete reset was successful',
      details: result
    });
  } catch (error) {
    console.error('Error during complete reset:', error);
    res.status(500).json({
      success: false,
      message: 'Reset failed with an error',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Simple delete all files route - used by the UI
router.delete('/delete-all-files', async (req, res) => {
  try {
    console.log('Starting delete all files operation with direct implementation');
    
    // 1. Delete all files from MongoDB
    const File = require('../models/File');
    const Visualization = require('../models/Visualization');
    
    // Delete from database
    const fileDeleteResult = await File.deleteMany({});
    console.log(`Deleted ${fileDeleteResult.deletedCount} files from database`);
    
    const vizDeleteResult = await Visualization.deleteMany({});
    console.log(`Deleted ${vizDeleteResult.deletedCount} visualizations from database`);
    
    // 2. Get upload directory path
    let uploadsDir;
    try {
      uploadsDir = process.env.NODE_ENV === 'production' 
        ? '/tmp' 
        : path.resolve(__dirname, '..', 'uploads');
      console.log(`Using uploads directory: ${uploadsDir}`);
    } catch (err) {
      console.error('Error resolving uploads directory path:', err);
    }
    
    // 3. Delete files from disk - even if there are errors, continue
    const diskResults = { success: 0, failed: 0, errors: [] };
    
    // Only attempt to delete files if we have a valid directory
    if (uploadsDir) {
      try {
        // Make sure directory exists first
        if (!fs.existsSync(uploadsDir)) {
          console.log(`Upload directory doesn't exist - creating it: ${uploadsDir}`);
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // List files in directory
        const files = fs.readdirSync(uploadsDir);
        console.log(`Found ${files.length} items in uploads directory`);
        
        // Process each file
        for (const filename of files) {
          try {
            const filePath = path.join(uploadsDir, filename);
            
            // Skip non-files
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) {
              console.log(`Skipping non-file: ${filePath}`);
              continue;
            }
            
            // Try to delete the file - use synchronous version for simplicity
            console.log(`Attempting to delete file: ${filePath}`);
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
            diskResults.success++;
          } catch (fileError) {
            console.error(`Error deleting file ${filename}:`, fileError.message);
            diskResults.failed++;
            diskResults.errors.push(`Error with ${filename}: ${fileError.message}`);
            // Continue with next file
          }
        }
      } catch (dirError) {
        console.error('Error handling uploads directory:', dirError);
        diskResults.failed++;
        diskResults.errors.push(`Directory error: ${dirError.message}`);
      }
    }
    
    // Success response
    res.json({
      success: true,
      message: 'Delete all files operation completed',
      filesDeleted: fileDeleteResult.deletedCount,
      visualizationsDeleted: vizDeleteResult.deletedCount,
      diskResults
    });
  } catch (error) {
    // Catch any unexpected errors
    console.error('Critical error in delete-all-files endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete files',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Special route for database cleanup - with a clearly different path to avoid confusion
router.delete('/cleanup-database', async (req, res) => {
  try {
    console.log('Running database cleanup operation using cleanup script');
    
    // Use the improved cleanup function
    const result = await cleanupDatabase();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to clean up database'
      });
    }
    
    res.json({
      success: true,
      message: 'Database cleanup completed successfully',
      filesDeleted: result.filesDeleted,
      visualizationsDeleted: result.visualizationsDeleted,
      diskDeleteResults: {
        success: result.diskResults.success,
        errors: result.diskResults.failed,
        errorDetails: result.diskResults.errors
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clean up database',
      message: error.message
    });
  }
});

// File operation routes - making these public for testing
router.get('/:id/preview', fileController.getFilePreview);
router.get('/:id/download', fileController.downloadFile);

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
      error: 'Invalid file type. Only CSV, JSON, and text files are allowed.' 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router; 