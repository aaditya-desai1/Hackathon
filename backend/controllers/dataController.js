const File = require('../models/File');
const { parseCSV, parseJSON } = require('../utils/dataParser');
const { transformData } = require('../utils/dataTransformer');
const { exportToCSV, exportToJSON } = require('../utils/dataExporter');
const path = require('path');

// Get data from a file
exports.getDataFromFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this file data' });
    }

    // Parse the data from the file
    let data = [];
    let columns = [];
    
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path, { limit, offset });
      data = result.data;
      columns = result.columns;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path, { limit, offset });
      data = result.data;
      columns = result.columns;
    }

    res.status(200).json({
      success: true,
      data,
      columns,
      meta: {
        total: data.length,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Analyze data from a file
exports.analyzeData = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { columns } = req.body;
    
    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to analyze this file data' });
    }

    // Parse and analyze the data
    let data = [];
    
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path);
      data = result.data;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path);
      data = result.data;
    }

    // Analyze specified columns or all columns if not specified
    const columnsToAnalyze = columns || file.dataColumns;
    const analysis = require('../utils/dataAnalyzer').analyzeData(data, columnsToAnalyze);

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Analyze data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply transformations to data
exports.applyTransformation = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { transformations } = req.body;
    
    if (!transformations || !Array.isArray(transformations)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid transformations array' 
      });
    }

    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to transform this file data' });
    }

    // Parse the data
    let data = [];
    let columns = [];
    
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path);
      data = result.data;
      columns = result.columns;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path);
      data = result.data;
      columns = result.columns;
    }

    // Apply transformations
    const transformedData = transformData(data, transformations);

    res.status(200).json({
      success: true,
      originalData: data.slice(0, 5), // Preview of original data
      transformedData: transformedData.slice(0, 10), // Preview of transformed data
      transformations,
      count: transformedData.length
    });
  } catch (error) {
    console.error('Transform data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Filter data
exports.filterData = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { filters } = req.body;
    
    if (!filters || !Array.isArray(filters)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid filters array' 
      });
    }

    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to filter this file data' });
    }

    // Parse the data
    let data = [];
    
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path);
      data = result.data;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path);
      data = result.data;
    }

    // Apply filters
    const filteredData = require('../utils/dataFilter').filterData(data, filters);

    res.status(200).json({
      success: true,
      data: filteredData.slice(0, 100), // Return first 100 filtered results
      count: filteredData.length,
      filters
    });
  } catch (error) {
    console.error('Filter data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export data
exports.exportData = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const format = req.query.format || 'csv';
    const { filters, transformations } = req.body;
    
    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Check authorization
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to export this file data' });
    }

    // Parse the data
    let data = [];
    let columns = [];
    
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path);
      data = result.data;
      columns = result.columns;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path);
      data = result.data;
      columns = result.columns;
    }

    // Apply filters if provided
    if (filters && Array.isArray(filters)) {
      data = require('../utils/dataFilter').filterData(data, filters);
    }

    // Apply transformations if provided
    if (transformations && Array.isArray(transformations)) {
      data = transformData(data, transformations);
    }

    // Export the data in the requested format
    let exportedData;
    let contentType;
    let filename;
    
    if (format === 'csv') {
      exportedData = exportToCSV(data);
      contentType = 'text/csv';
      filename = `${path.basename(file.originalname, path.extname(file.originalname))}_export.csv`;
    } else if (format === 'json') {
      exportedData = exportToJSON(data);
      contentType = 'application/json';
      filename = `${path.basename(file.originalname, path.extname(file.originalname))}_export.json`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export format' });
    }

    // Set response headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send the exported data
    res.send(exportedData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 