const { Parser } = require('json2csv');

/**
 * Export data to CSV format
 * @param {Array} data - Array of data objects
 * @param {Object} options - Export options
 * @returns {string} - CSV string
 */
exports.exportToCSV = (data, options = {}) => {
  if (!data || !data.length) {
    return '';
  }

  try {
    // Extract columns from the first data item
    const fields = Object.keys(data[0]);
    
    // Create parser with options
    const parserOptions = {
      fields,
      ...options
    };
    
    const parser = new Parser(parserOptions);
    return parser.parse(data);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

/**
 * Export data to JSON format
 * @param {Array} data - Array of data objects
 * @param {Object} options - Export options
 * @returns {string} - JSON string
 */
exports.exportToJSON = (data, options = {}) => {
  if (!data) {
    return '[]';
  }

  try {
    const { pretty = true } = options;
    
    if (pretty) {
      return JSON.stringify(data, null, 2);
    } else {
      return JSON.stringify(data);
    }
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw new Error(`JSON export failed: ${error.message}`);
  }
};

/**
 * Export data to Excel format
 * Note: This is a placeholder - Excel export would require additional libraries
 * @param {Array} data - Array of data objects
 * @param {Object} options - Export options
 * @returns {Buffer} - Excel file buffer
 */
exports.exportToExcel = (data, options = {}) => {
  throw new Error('Excel export not implemented');
};

/**
 * Determine file extension from format
 * @param {string} format - Export format
 * @returns {string} - File extension
 */
exports.getFileExtension = (format) => {
  switch (format.toLowerCase()) {
    case 'csv':
      return '.csv';
    case 'json':
      return '.json';
    case 'excel':
    case 'xlsx':
      return '.xlsx';
    default:
      return '.txt';
  }
};

/**
 * Get MIME type for export format
 * @param {string} format - Export format
 * @returns {string} - MIME type
 */
exports.getMimeType = (format) => {
  switch (format.toLowerCase()) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'excel':
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'text/plain';
  }
}; 