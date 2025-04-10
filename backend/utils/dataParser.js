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
    console.log('[dataParser] Reading CSV file:', filePath);
    console.log('[dataParser] CSV file content length:', content.length);
    
    if (content.trim().length === 0) {
      console.log('[dataParser] Empty CSV file');
      return {
        data: [],
        columns: [],
        preview: []
      };
    }
    
    // Check if the file has at least one comma or tab to be a valid CSV
    const hasSeparators = content.includes(',') || content.includes('\t') || content.includes(';');
    if (!hasSeparators) {
      console.warn('[dataParser] CSV file might not have proper delimiters');
    }
    
    return new Promise((resolve, reject) => {
      csv.parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true, // Be more forgiving of missing columns
        relax: true, // Be more forgiving of quoting errors
        trim: true, // Trim whitespace from fields
        skip_lines_with_error: true // Skip lines with errors instead of failing
      }, (err, data) => {
        if (err) {
          console.error('[dataParser] CSV parsing error:', err);
          return reject(err);
        }
        
        // Handle case where data is undefined or empty
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('[dataParser] CSV parsed but no data found');
          return resolve({
            data: [],
            columns: [],
            preview: []
          });
        }
        
        console.log('[dataParser] CSV parsed successfully with', data.length, 'records');
        const columns = Object.keys(data[0]);
        resolve({
          data,
          columns,
          preview: data.slice(0, 5)
        });
      });
    });
  } catch (error) {
    console.error('[dataParser] Error processing CSV file:', error);
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
    console.log('[dataParser] Reading JSON file:', filePath);
    
    // Try to safely parse the JSON with error handling
    let data;
    try {
      // First, attempt to clean the content of any BOM or unwanted characters
      const cleanContent = content.trim().replace(/^\uFEFF/, '');
      console.log('[dataParser] JSON file content length:', cleanContent.length);
      
      if (cleanContent.length === 0) {
        console.log('[dataParser] Empty JSON file');
        return {
          data: [],
          columns: [],
          preview: []
        };
      }
      
      // Validate if the content begins with { or [ 
      if (!(cleanContent.startsWith('{') || cleanContent.startsWith('['))) {
        console.error('[dataParser] Invalid JSON format:', cleanContent.substring(0, 50) + '...');
        throw new Error('Invalid JSON format. File must start with { or [');
      }
      
      data = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[dataParser] JSON parse error:', parseError.message);
      console.error('[dataParser] Content snippet:', content.substring(0, 100));
      throw new Error(`Error parsing JSON: ${parseError.message}`);
    }
    
    // Handle both array and object formats
    const parsedData = Array.isArray(data) ? data : [data];
    
    if (parsedData.length === 0) {
      console.log('[dataParser] JSON parsed but no data found');
      return {
        data: [],
        columns: [],
        preview: []
      };
    }
    
    console.log('[dataParser] JSON parsed successfully with', parsedData.length, 'records');
    const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    
    return {
      data: parsedData,
      columns,
      preview: parsedData.slice(0, 5)
    };
  } catch (error) {
    console.error('[dataParser] Error processing JSON file:', error);
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