/**
 * Analyze data to extract statistics and metadata
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column names
 * @returns {Object} - Analysis results for each column
 */
exports.analyzeData = (data, columns) => {
  if (!data || !data.length || !columns || !columns.length) {
    return {};
  }

  const analysis = {};
  
  columns.forEach(column => {
    // Extract all values for this column
    const values = data.map(row => row[column])
                      .filter(val => val !== null && val !== undefined);
    
    // Skip empty columns
    if (values.length === 0) {
      analysis[column] = { type: 'unknown', count: 0 };
      return;
    }

    // Determine the data type
    const types = values.map(val => typeof val);
    const mostCommonType = getMostCommonType(types);
    
    // Initialize analysis object for this column
    analysis[column] = {
      type: mostCommonType,
      count: values.length,
      missing: data.length - values.length,
      uniqueCount: getUniqueCount(values)
    };
    
    // Add type-specific statistics
    if (mostCommonType === 'number') {
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      
      if (numericValues.length > 0) {
        analysis[column].min = Math.min(...numericValues);
        analysis[column].max = Math.max(...numericValues);
        analysis[column].sum = numericValues.reduce((sum, val) => sum + val, 0);
        analysis[column].avg = analysis[column].sum / numericValues.length;
        analysis[column].median = getMedian(numericValues);
        analysis[column].stdDev = getStandardDeviation(numericValues);
        analysis[column].histogram = generateHistogram(numericValues, 10);
        analysis[column].outliers = detectOutliers(numericValues);
      }
    } else if (mostCommonType === 'string') {
      // For strings, get unique values and their frequencies
      const valueFrequency = getValueFrequency(values);
      
      // Get the most common values
      const sortedValues = Object.entries(valueFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      analysis[column].mostCommon = sortedValues.map(([value, count]) => ({ value, count }));
      analysis[column].minLength = Math.min(...values.map(v => String(v).length));
      analysis[column].maxLength = Math.max(...values.map(v => String(v).length));
      analysis[column].avgLength = values.reduce((sum, val) => sum + String(val).length, 0) / values.length;
      
      // Check if it could be a categorical variable
      if (analysis[column].uniqueCount <= 20 || (analysis[column].uniqueCount / values.length) < 0.05) {
        analysis[column].isCategorical = true;
        analysis[column].categories = Object.keys(valueFrequency);
        analysis[column].categoryDistribution = Object.entries(valueFrequency)
          .map(([category, count]) => ({
            category,
            count,
            percentage: (count / values.length) * 100
          }))
          .sort((a, b) => b.count - a.count);
      }
      
      // Check if it could be a date
      analysis[column].couldBeDate = checkIfCouldBeDate(values);
    } else if (mostCommonType === 'boolean') {
      const trueCount = values.filter(v => v === true || v === 'true').length;
      const falseCount = values.filter(v => v === false || v === 'false').length;
      
      analysis[column].trueCount = trueCount;
      analysis[column].falseCount = falseCount;
      analysis[column].truePercentage = (trueCount / values.length) * 100;
      analysis[column].falsePercentage = (falseCount / values.length) * 100;
    }
    
    // Check correlations with other columns for numeric columns
    if (mostCommonType === 'number') {
      analysis[column].correlations = {};
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      
      columns.forEach(otherColumn => {
        if (otherColumn !== column) {
          const otherValues = data.map(row => row[otherColumn])
                                 .filter((val, idx) => val !== null && val !== undefined && !isNaN(Number(val)));
          
          if (otherValues.length === numericValues.length) {
            analysis[column].correlations[otherColumn] = calculateCorrelation(
              numericValues,
              otherValues.map(v => Number(v))
            );
          }
        }
      });
    }
  });
  
  return analysis;
};

/**
 * Get the most common data type in an array
 * @param {Array} types - Array of type strings
 * @returns {string} - Most common type
 */
function getMostCommonType(types) {
  const typeCounts = {};
  types.forEach(type => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  let mostCommonType = 'string';
  let maxCount = 0;
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      mostCommonType = type;
      maxCount = count;
    }
  }
  
  return mostCommonType;
}

/**
 * Calculate the median of an array of numbers
 * @param {Array} values - Array of numeric values
 * @returns {number} - Median value
 */
function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Get the count of unique values
 * @param {Array} values - Array of values
 * @returns {number} - Count of unique values
 */
function getUniqueCount(values) {
  return new Set(values).size;
}

/**
 * Get frequency of each value in an array
 * @param {Array} values - Array of values
 * @returns {Object} - Object with values as keys and counts as values
 */
function getValueFrequency(values) {
  const frequency = {};
  
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  
  return frequency;
}

/**
 * Calculate standard deviation
 * @param {Array} values - Array of numeric values
 * @returns {number} - Standard deviation
 */
function getStandardDeviation(values) {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Generate a histogram for numeric data
 * @param {Array} values - Array of numeric values
 * @param {number} bins - Number of bins
 * @returns {Array} - Histogram data
 */
function generateHistogram(values, bins) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins;
  
  const histogram = Array(bins).fill(0);
  
  values.forEach(value => {
    // Handle the edge case where value === max
    const binIndex = value === max 
      ? bins - 1 
      : Math.floor((value - min) / binWidth);
    
    histogram[binIndex]++;
  });
  
  // Generate bin ranges
  const result = [];
  for (let i = 0; i < bins; i++) {
    const start = min + i * binWidth;
    const end = min + (i + 1) * binWidth;
    
    result.push({
      bin: i,
      range: [start, end],
      count: histogram[i],
      percentage: (histogram[i] / values.length) * 100
    });
  }
  
  return result;
}

/**
 * Detect outliers using the IQR method
 * @param {Array} values - Array of numeric values
 * @returns {Array} - Outlier values
 */
function detectOutliers(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(val => val < lowerBound || val > upperBound);
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 * @param {Array} x - First array of numeric values
 * @param {Array} y - Second array of numeric values
 * @returns {number} - Correlation coefficient
 */
function calculateCorrelation(x, y) {
  if (x.length !== y.length) {
    return null;
  }
  
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    covariance += diffX * diffY;
    varX += diffX * diffX;
    varY += diffY * diffY;
  }
  
  covariance /= n;
  varX /= n;
  varY /= n;
  
  const stdX = Math.sqrt(varX);
  const stdY = Math.sqrt(varY);
  
  // Calculate correlation coefficient
  return covariance / (stdX * stdY);
}

/**
 * Check if values could be dates
 * @param {Array} values - Array of values
 * @returns {boolean} - Whether values could be dates
 */
function checkIfCouldBeDate(values) {
  const sampleSize = Math.min(values.length, 100); // Check at most 100 values
  let dateCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const value = String(values[i]);
    const date = new Date(value);
    
    // Check if it parsed to a valid date that's not just the current date
    if (!isNaN(date.getTime()) && value.length > 4) {
      dateCount++;
    }
  }
  
  // Return true if at least 80% of sampled values could be dates
  return (dateCount / sampleSize) >= 0.8;
} 