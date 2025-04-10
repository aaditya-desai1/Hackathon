const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');
const { parseCSV, parseJSON, analyzeDataColumns } = require('../utils/dataParser');
const dataAnalysisService = require('../services/dataAnalysisService');
const mongoose = require('mongoose');

// Helper function to handle file paths
const getUploadDir = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/tmp' 
    : path.join(__dirname, '..', 'uploads');
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    console.log('[FileController] Upload request received');
    console.log('[FileController] Environment:', process.env.NODE_ENV);
    console.log('[FileController] MongoDB connection state:', mongoose.connection.readyState);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[FileController] File received:', { 
      name: req.file.originalname, 
      type: req.file.mimetype, 
      size: req.file.size,
      path: req.file.path
    });

    // Validate file exists on disk
    try {
      await fs.access(req.file.path);
      console.log(`[FileController] File exists at ${req.file.path}`);
      
      // Check file size on disk
      const stats = await fs.stat(req.file.path);
      console.log(`[FileController] File size on disk: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        console.error('[FileController] File is empty');
        return res.status(400).json({ error: 'File is empty' });
      }
    } catch (err) {
      console.error(`[FileController] File access error: ${err.message}`);
      return res.status(500).json({ error: 'Uploaded file could not be processed' });
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path).catch(err => {
        console.error('[FileController] Error deleting invalid file:', err);
      });
      return res.status(400).json({ error: 'Invalid file type. Only CSV, JSON, and plain text files are allowed.' });
    }

    // Check if uploads directory exists and is writable
    const uploadsDir = getUploadDir();
    try {
      await fs.access(uploadsDir, fs.constants.W_OK);
      console.log(`[FileController] Upload directory ${uploadsDir} is writable`);
    } catch (err) {
      console.error(`[FileController] Upload directory error:`, err);
      return res.status(500).json({ error: 'Server storage configuration error' });
    }

    // Create file record
    const fileData = {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype,
      user: req.user ? req.user._id : null, // Make user optional
      createdAt: new Date() // Explicitly set creation date
    };

    // Read and validate file content
    try {
      const content = await fs.readFile(req.file.path, 'utf-8');
      console.log(`[FileController] Read file content, length: ${content.length} characters`);
      
      // Simple sanity check for file content
      if (content.trim().length === 0) {
        console.error('[FileController] File content is empty');
        return res.status(400).json({ error: 'File content is empty' });
      }
    } catch (readErr) {
      console.error('[FileController] Error reading file content:', readErr);
    }

    // Parse file to get initial data
    try {
      let parseResult;
      console.log('[FileController] Parsing file...');
      
      if (req.file.mimetype === 'text/csv' || (req.file.mimetype === 'text/plain' && req.file.originalname.endsWith('.csv'))) {
        parseResult = await parseCSV(req.file.path);
      } else if (req.file.mimetype === 'application/json' || (req.file.mimetype === 'text/plain' && req.file.originalname.endsWith('.json'))) {
        parseResult = await parseJSON(req.file.path);
      } else {
        // Attempt to auto-detect format for plain text
        const content = await fs.readFile(req.file.path, 'utf-8');
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          parseResult = await parseJSON(req.file.path);
        } else if (content.includes(',') || content.includes('\t') || content.includes(';')) {
          parseResult = await parseCSV(req.file.path);
        } else {
          throw new Error('Could not determine file format');
        }
      }

      console.log('[FileController] File parsed successfully');
      fileData.dataColumns = parseResult.columns;
      fileData.dataPreview = parseResult.preview;
    } catch (parseError) {
      console.error('[FileController] File parsing error:', parseError);
      return res.status(400).json({ 
        error: 'Error parsing file', 
        details: parseError.message 
      });
    }

    console.log('[FileController] Creating file record in database');
    const file = new File(fileData);
    await file.save();
    
    console.log('[FileController] File saved to database with ID:', file._id);

    res.status(201).json({
      success: true,
      file: {
        _id: file._id,
        name: file.name,
        type: file.type,
        size: file.size,
        columns: file.dataColumns,
        preview: file.dataPreview,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('[FileController] Upload error:', error);
    // Clean up uploaded file if database save fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => {
        console.error('[FileController] Error deleting file after upload failure:', err);
      });
    }
    res.status(500).json({ error: error.message || 'Error uploading file' });
  }
};

// Get all files
exports.getFiles = async (req, res) => {
  try {
    console.log('[FileController] getFiles called');
    
    // Build query - if user is authenticated, filter by user ID, otherwise show all
    const query = req.user ? { user: req.user._id } : {};
    console.log('[FileController] Using query:', JSON.stringify(query));
    
    // Check MongoDB connection
    console.log('[FileController] MongoDB connection state:', mongoose.connection.readyState);
    
    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .select('-path'); // Don't send file paths to client

    console.log('[FileController] Found files:', files.length);
    
    res.json({
      success: true,
      files: files.map(file => ({
        _id: file._id,
        name: file.name,
        type: file.type,
        size: file.size,
        columns: file.dataColumns,
        preview: file.dataPreview,
        createdAt: file.createdAt,
        isAnalyzed: file.isAnalyzed
      }))
    });
  } catch (error) {
    console.error('[FileController] Error in getFiles:', error);
    res.status(500).json({ error: error.message || 'Error fetching files' });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    // Build query - if user is authenticated, filter by user ID, otherwise just use the file ID
    const query = req.user 
      ? { _id: req.params.id, user: req.user._id }
      : { _id: req.params.id };
      
    const file = await File.findOne(query).select('-path');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      file: {
        _id: file._id,
        name: file.name,
        type: file.type,
        size: file.size,
        columns: file.dataColumns,
        preview: file.dataPreview,
        createdAt: file.createdAt,
        isAnalyzed: file.isAnalyzed,
        dataStats: file.dataStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    // Build query - if user is authenticated, filter by user ID, otherwise just use the file ID
    const query = req.user 
      ? { _id: req.params.id, user: req.user._id }
      : { _id: req.params.id };
      
    const file = await File.findOne(query);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    try {
      // Delete file from filesystem
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Error deleting file from filesystem:', unlinkError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete from database
    await File.deleteOne({ _id: file._id });
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFile controller:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
};

// Analyze file data
exports.analyzeFile = async (req, res) => {
  try {
    // Build query - if user is authenticated, filter by user ID, otherwise just use the file ID
    const query = req.user 
      ? { _id: req.params.id, user: req.user._id }
      : { _id: req.params.id };
      
    const file = await File.findOne(query);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const analysis = await dataAnalysisService.analyzeFile(file.path, file.type);
    
    // Update file with analysis results
    file.dataStats = analysis;
    file.isAnalyzed = true;
    await file.save();

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing file:', error);
    res.status(500).json({ error: 'Error analyzing file' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    // Build query - if user is authenticated, filter by user ID, otherwise just use the file ID
    const query = req.user 
      ? { _id: req.params.id, user: req.user._id }
      : { _id: req.params.id };
      
    const file = await File.findOne(query);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(file.path, file.name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// File preview endpoint
exports.getFilePreview = async (req, res) => {
  try {
    // Build query - if user is authenticated, filter by user ID, otherwise just use the file ID
    const query = req.user 
      ? { _id: req.params.id, user: req.user._id }
      : { _id: req.params.id };
      
    const file = await File.findOne(query);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    let data;
    if (file.type === 'text/csv') {
      data = await parseCSV(file.path);
    } else if (file.type === 'application/json') {
      data = await parseJSON(file.path);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    res.json({
      success: true,
      headers: data.columns || [],
      rows: data.data || data.preview || [],
      columns: data.columns || []
    });
  } catch (error) {
    console.error('Error getting file preview:', error);
    res.status(500).json({ error: 'Failed to fetch file preview' });
  }
}; 