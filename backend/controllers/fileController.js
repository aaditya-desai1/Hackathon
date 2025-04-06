const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');
const { parseCSV, parseJSON, analyzeDataColumns } = require('../utils/dataParser');
const dataAnalysisService = require('../services/dataAnalysisService');
const mongoose = require('mongoose');

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', { 
      name: req.file.originalname, 
      type: req.file.mimetype, 
      size: req.file.size 
    });

    // Validate file type
    const allowedTypes = ['text/csv', 'application/json'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Invalid file type' });
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

    // Parse file to get initial data
    try {
      let parseResult;
      if (req.file.mimetype === 'text/csv') {
        parseResult = await parseCSV(req.file.path);
      } else {
        parseResult = await parseJSON(req.file.path);
      }

      fileData.dataColumns = parseResult.columns;
      fileData.dataPreview = parseResult.preview;
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      // Continue even if parsing fails - we'll handle it during analysis
    }

    const file = new File(fileData);
    await file.save();
    
    console.log('File saved to database with ID:', file._id);

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
    console.error('Upload error:', error);
    // Clean up uploaded file if database save fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
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