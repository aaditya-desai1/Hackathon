const path = require('path');
const fs = require('fs');
const File = require('../models/File');
// Import AI service
const aiService = require('../services/aiService');

// Get chart recommendations
exports.getChartRecommendations = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Get the file data
    const filePath = path.join(__dirname, '..', 'uploads', file.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File data not found' });
    }
    
    // Read and parse the file
    const fileData = await parseFile(filePath, file.type);
    
    // Get columns and data
    const columns = Object.keys(fileData[0]);
    
    // Calculate basic statistics for each column
    const stats = calculateColumnStats(fileData, columns);
    
    // Get AI recommendations
    const recommendations = await aiService.recommendChartType(fileData, columns, stats);
    
    return res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting chart recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting chart recommendations',
      error: error.message
    });
  }
};

// Calculate basic column statistics for AI service
function calculateColumnStats(data, columns) {
  const stats = {};
  
  columns.forEach(column => {
    const values = data.map(row => row[column])
                     .filter(val => val !== null && val !== undefined);
    
    // Calculate basic stats
    stats[column] = {
      uniqueCount: new Set(values).size,
      count: values.length,
      type: guessColumnType(values)
    };
    
    // For numeric columns, calculate min, max, mean
    if (stats[column].type === 'numerical') {
      const numericValues = values.map(v => parseFloat(v))
                                 .filter(v => !isNaN(v));
      
      stats[column].min = Math.min(...numericValues);
      stats[column].max = Math.max(...numericValues);
      stats[column].mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }
  });
  
  return stats;
}

// Guess column type (numerical, categorical, datetime)
function guessColumnType(values) {
  // Sample some values
  const sampleSize = Math.min(100, values.length);
  const sampleValues = values.slice(0, sampleSize);
  
  // Count numeric values
  const numericCount = sampleValues.filter(val => 
    !isNaN(parseFloat(val)) && isFinite(val)).length;
  
  // If most values are numeric, it's a numerical column
  if (numericCount / sampleSize > 0.8) {
    return 'numerical';
  }
  
  // Check for date patterns
  const datePattern = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const dateCount = sampleValues.filter(val => 
    val && datePattern.test(String(val))).length;
  
  if (dateCount / sampleSize > 0.8) {
    return 'datetime';
  }
  
  // Otherwise consider it categorical
  return 'categorical';
}

/**
 * Parse a file based on its type
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of file (csv, json, etc.)
 * @returns {Array} - Parsed data as array of objects
 */
async function parseFile(filePath, fileType) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    if (fileType.toLowerCase() === 'csv') {
      // Parse CSV
      return parseCSV(fileContent);
    } else if (fileType.toLowerCase() === 'json') {
      // Parse JSON
      return JSON.parse(fileContent);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
}

/**
 * Parse CSV content to array of objects
 * @param {string} content - CSV content
 * @returns {Array} - Array of objects
 */
function parseCSV(content) {
  // Split by lines and filter out empty lines
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  // Get headers
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(value => value.trim());
    
    // Skip if row has wrong number of columns
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i+1} due to column count mismatch`);
      continue;
    }
    
    // Create object from headers and values
    const obj = {};
    headers.forEach((header, index) => {
      // Convert to number if possible
      const value = values[index];
      obj[header] = !isNaN(parseFloat(value)) && isFinite(value) ? parseFloat(value) : value;
    });
    
    data.push(obj);
  }
  
  return data;
} 