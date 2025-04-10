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

    let exportedData;
    let contentType;
    let fileName;
    
    if (format === 'json') {
      exportedData = exportToJSON(data);
      contentType = 'application/json';
      fileName = `${path.basename(file.name, path.extname(file.name))}_export.json`;
    } else {
      exportedData = exportToCSV(data, columns);
      contentType = 'text/csv';
      fileName = `${path.basename(file.name, path.extname(file.name))}_export.csv`;
    }

    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(exportedData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get data for chart visualization
exports.getChartData = async (req, res) => {
  try {
    const { fileId, xAxis, yAxis } = req.query;
    
    console.log('Chart data request params:', { fileId, xAxis, yAxis });
    
    if (!fileId || !xAxis || !yAxis) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: fileId, xAxis, and yAxis are required' 
      });
    }
    
    // Find the file record
    const file = await File.findById(fileId);
    if (!file) {
      console.log('File not found with ID:', fileId);
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    console.log('Found file:', {
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      columns: file.dataColumns
    });

    // Check authorization if needed
    if (req.user && file.user && req.user.id !== file.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this file data' });
    }

    // Parse the data
    let data = [];
    
    // Get file type (handle both type and mimetype fields)
    const fileType = file.type || file.mimetype;
    console.log('Detected file type:', fileType);
    
    if (fileType && (fileType.includes('csv') || fileType === 'text/csv')) {
      console.log('Parsing CSV file at path:', file.path);
      const result = await parseCSV(file.path);
      data = result.data;
      console.log('Parsed CSV data, row count:', data.length);
    } else if (fileType && (fileType.includes('json') || fileType === 'application/json')) {
      console.log('Parsing JSON file at path:', file.path);
      const result = await parseJSON(file.path);
      data = result.data;
      console.log('Parsed JSON data, row count:', data.length);
    } else {
      console.log('Unsupported file type:', fileType);
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }
    
    console.log('Data sample:', data.slice(0, 2));
    console.log('Looking for x-axis:', xAxis, 'and y-axis:', yAxis);

    // Process data for chart
    // Extract unique labels for X-axis
    const uniqueLabels = [...new Set(data.map(item => item[xAxis]))].filter(Boolean);
    console.log('Extracted unique labels:', uniqueLabels);
    
    // If too many labels, limit the number
    const maxLabels = 20;
    const labels = uniqueLabels.length > maxLabels ? uniqueLabels.slice(0, maxLabels) : uniqueLabels;
    
    // Prepare values based on labels
    const values = [];
    
    // Calculate values based on chart type
    // For each unique x-value, calculate corresponding y-value (sum, average, count)
    labels.forEach(label => {
      const matchingRows = data.filter(item => item[xAxis] === label);
      console.log(`Matching rows for "${label}":`, matchingRows.length);
      
      const numericValues = matchingRows
        .map(item => parseFloat(item[yAxis]))
        .filter(val => !isNaN(val));
      
      console.log(`Numeric values for "${label}":`, numericValues.length);
      
      // Calculate sum of y values for this label
      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      
      // For numeric Y values, use sum; for non-numeric, use count
      values.push(numericValues.length > 0 ? sum : matchingRows.length);
    });
    
    console.log('Final label-value pairs:', labels.map((label, i) => ({ label, value: values[i] })));
    
    // For empty or invalid data, provide default
    if (labels.length === 0 || values.length === 0) {
      console.log('No valid data found, returning default values');
      return res.status(200).json({
        success: true,
        chartData: {
          labels: ['No Data', 'Available'],
          values: [0, 0]
        }
      });
    }

    const response = {
      success: true,
      chartData: {
        labels: labels,
        values: values
      }
    };
    
    console.log('Sending chart data response');
    res.status(200).json(response);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 