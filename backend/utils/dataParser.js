const fs = require('fs').promises;
const csv = require('csv-parse');
const path = require('path');

/**
 * Parse a CSV file
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - Options for parsing
 * @param {number} options.limit - Maximum number of rows to return
 * @param {number} options.offset - Number of rows to skip
 * @returns {Promise<Object>} - Parsed data, columns, and preview
 */
exports.parseCSV = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return new Promise((resolve, reject) => {
      csv.parse(content, {
        columns: true,
        skip_empty_lines: true
      }, (err, data) => {
        if (err) {
          return reject(err);
        }
        
        // Handle case where data is undefined or empty
        if (!data || !Array.isArray(data) || data.length === 0) {
          return resolve({
            data: [],
            columns: [],
            preview: []
          });
        }
        
        const columns = Object.keys(data[0]);
        resolve({
          data,
          columns,
          preview: data.slice(0, 5)
        });
      });
    });
  } catch (error) {
    throw new Error(`Error parsing CSV file: ${error.message}`);
  }
};

/**
 * Parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Object} options - Options for parsing
 * @param {number} options.limit - Maximum number of rows to return
 * @param {number} options.offset - Number of rows to skip
 * @returns {Promise<Object>} - Parsed data, columns, and preview
 */
exports.parseJSON = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Handle both array and object formats
    const parsedData = Array.isArray(data) ? data : [data];
    const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    
    return {
      data: parsedData,
      columns,
      preview: parsedData.slice(0, 5)
    };
  } catch (error) {
    throw new Error(`Error parsing JSON file: ${error.message}`);
  }
};

/**
 * Analyze data columns to extract statistics and metadata
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column names
 * @returns {Object} - Analysis results for each column
 */
exports.analyzeDataColumns = (data, columns) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  const analysis = {};
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    analysis[column] = analyzeColumn(values);
  });

  return analysis;
};

function analyzeColumn(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const uniqueValues = new Set(nonNullValues);
  
  const analysis = {
    totalCount: values.length,
    nonNullCount: nonNullValues.length,
    uniqueCount: uniqueValues.size,
    type: detectDataType(nonNullValues)
  };

  if (analysis.type === 'number') {
    const numbers = nonNullValues.map(v => parseFloat(v));
    analysis.stats = calculateNumericStats(numbers);
  }

  return analysis;
}

function detectDataType(values) {
  if (values.length === 0) return 'empty';
  
  const sample = values[0];
  if (typeof sample === 'number' || !isNaN(sample)) return 'number';
  if (isDateString(sample)) return 'date';
  return 'string';
}

function isDateString(value) {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
}

function calculateNumericStats(numbers) {
  if (numbers.length === 0) return null;

  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  const sortedNumbers = [...numbers].sort((a, b) => a - b);

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    mean: mean,
    median: calculateMedian(sortedNumbers),
    standardDeviation: calculateStandardDeviation(numbers, mean)
  };
}

function calculateMedian(sortedNumbers) {
  const mid = Math.floor(sortedNumbers.length / 2);
  return sortedNumbers.length % 2 !== 0
    ? sortedNumbers[mid]
    : (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2;
}

function calculateStandardDeviation(numbers, mean) {
  const squareDiffs = numbers.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(avgSquareDiff);
} 