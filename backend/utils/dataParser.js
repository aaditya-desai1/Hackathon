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
    
    // Show the first 100 chars for debugging
    console.log('[dataParser] Content start (first 100 chars):', 
      content.substring(0, 100).replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    
    if (content.trim().length === 0) {
      console.log('[dataParser] Empty CSV file');
      return {
        data: [],
        columns: [],
        preview: []
      };
    }
    
    // Try to detect and fix common CSV issues
    let cleanContent = content;
    
    // Remove BOM if present
    cleanContent = cleanContent.replace(/^\uFEFF/, '');
    
    // Check if the file has at least one comma or tab to be a valid CSV
    const hasSeparators = cleanContent.includes(',') || cleanContent.includes('\t') || cleanContent.includes(';');
    if (!hasSeparators) {
      console.warn('[dataParser] CSV file might not have proper delimiters');
      throw new Error('CSV file does not contain proper delimiters (comma, tab, or semicolon)');
    }
    
    // Try to detect the delimiter
    const firstLine = cleanContent.split(/\r?\n/)[0];
    let delimiter = ',';
    
    if (firstLine.includes('\t') && !firstLine.includes(',')) {
      delimiter = '\t';
      console.log('[dataParser] Detected tab delimiter');
    } else if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
      console.log('[dataParser] Detected semicolon delimiter');
    } else {
      console.log('[dataParser] Using comma delimiter');
    }
    
    // Handle invalid line endings by normalizing them
    cleanContent = cleanContent.replace(/\r\n|\r|\n/g, '\n');
    
    return new Promise((resolve, reject) => {
      csv.parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true, // Be more forgiving of missing columns
        relax: true, // Be more forgiving of quoting errors
        trim: true, // Trim whitespace from fields
        skip_lines_with_error: true, // Skip lines with errors instead of failing
        delimiter: delimiter
      }, (err, data) => {
        if (err) {
          console.error('[dataParser] CSV parsing error:', err);
          
          // Try again without headers as a fallback
          csv.parse(cleanContent, {
            columns: false,
            skip_empty_lines: true,
            relax_column_count: true,
            relax: true,
            trim: true,
            skip_lines_with_error: true,
            delimiter: delimiter
          }, (fallbackErr, fallbackData) => {
            if (fallbackErr) {
              console.error('[dataParser] Fallback CSV parsing also failed:', fallbackErr);
              return reject(err); // Return original error
            }
            
            if (!fallbackData || !Array.isArray(fallbackData) || fallbackData.length === 0) {
              console.log('[dataParser] Fallback parsing returned no data');
              return resolve({
                data: [],
                columns: [],
                preview: []
              });
            }
            
            // Generate column names (col0, col1, etc.)
            const firstRow = fallbackData[0];
            const columns = firstRow.map((_, i) => `col${i}`);
            
            // Convert array rows to objects
            const objectData = fallbackData.map(row => {
              const obj = {};
              row.forEach((val, i) => {
                obj[columns[i]] = val;
              });
              return obj;
            });
            
            console.log('[dataParser] Fallback CSV parsing recovered', objectData.length, 'rows');
            resolve({
              data: objectData,
              columns,
              preview: objectData.slice(0, 5)
            });
          });
          return;
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
        
        // Ensure there are columns by checking the first non-empty row
        let columns = [];
        for (const row of data) {
          if (row && typeof row === 'object') {
            columns = Object.keys(row);
            if (columns.length > 0) break;
          }
        }
        
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
      const contentLength = content.length;
      console.log('[dataParser] JSON raw content length:', contentLength);
      
      if (contentLength === 0) {
        console.log('[dataParser] Empty JSON file');
        return {
          data: [],
          columns: [],
          preview: []
        };
      }
      
      // Show the first 100 chars for debugging
      console.log('[dataParser] Content start (first 100 chars):', 
        content.substring(0, 100).replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
      
      // Remove BOM and whitespace
      let cleanContent = content.replace(/^\uFEFF/, '').trim();
      
      // Remove any leading garbage before { or [
      const firstBrace = cleanContent.indexOf('{');
      const firstBracket = cleanContent.indexOf('[');
      
      if (firstBrace === -1 && firstBracket === -1) {
        throw new Error('JSON file must contain an object or array');
      }
      
      const startIndex = firstBrace !== -1 && firstBracket !== -1
        ? Math.min(firstBrace, firstBracket)
        : Math.max(firstBrace, firstBracket);
        
      if (startIndex > 0) {
        console.log(`[dataParser] Removing ${startIndex} characters of non-JSON prefix`);
        cleanContent = cleanContent.substring(startIndex);
      }
      
      // Find where the JSON actually ends (in case there's trailing garbage)
      let endIndex = cleanContent.length;
      
      // Gradually try parsing smaller portions if initial parse fails
      try {
        data = JSON.parse(cleanContent);
      } catch (initialError) {
        console.log('[dataParser] Initial JSON parse failed, trying to fix content...');
        
        // Try to find a valid JSON substring
        if (cleanContent.startsWith('{')) {
          // For objects, find matching closing brace
          let braceCount = 0;
          let i = 0;
          for (i = 0; i < cleanContent.length; i++) {
            if (cleanContent[i] === '{') braceCount++;
            if (cleanContent[i] === '}') braceCount--;
            if (braceCount === 0 && i > 0) {
              endIndex = i + 1;
              break;
            }
          }
        } else if (cleanContent.startsWith('[')) {
          // For arrays, find matching closing bracket
          let bracketCount = 0;
          let i = 0;
          for (i = 0; i < cleanContent.length; i++) {
            if (cleanContent[i] === '[') bracketCount++;
            if (cleanContent[i] === ']') bracketCount--;
            if (bracketCount === 0 && i > 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        
        if (endIndex < cleanContent.length) {
          console.log(`[dataParser] Truncating JSON at position ${endIndex}`);
          cleanContent = cleanContent.substring(0, endIndex);
        }
        
        // Try parsing again with the fixed content
        try {
          data = JSON.parse(cleanContent);
          console.log('[dataParser] Successfully parsed after fixing content');
        } catch (error) {
          console.error('[dataParser] Final JSON parse error:', error.message);
          throw error;
        }
      }
    } catch (parseError) {
      console.error('[dataParser] JSON parse error:', parseError.message);
      console.error('[dataParser] Content snippet:', content.substring(0, 200).replace(/\n/g, '\\n'));
      throw new Error(`Error parsing JSON: ${parseError.message}`);
    }
    
    // Handle both array and object formats
    let parsedData;
    if (Array.isArray(data)) {
      parsedData = data;
    } else if (typeof data === 'object' && data !== null) {
      parsedData = [data];
    } else {
      console.error('[dataParser] Unexpected JSON structure:', typeof data);
      throw new Error('JSON must contain an object or array');
    }
    
    if (parsedData.length === 0) {
      console.log('[dataParser] JSON parsed but no data found');
      return {
        data: [],
        columns: [],
        preview: []
      };
    }
    
    console.log('[dataParser] JSON parsed successfully with', parsedData.length, 'records');
    
    // Extract columns, handling the first non-null item
    let columns = [];
    for (const item of parsedData) {
      if (item && typeof item === 'object') {
        columns = Object.keys(item);
        if (columns.length > 0) break;
      }
    }
    
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