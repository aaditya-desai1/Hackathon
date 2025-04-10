/**
 * AI Service for chart recommendation and data analysis
 */

/**
 * Recommend the best chart type based on the dataset
 * @param {Array} data - The dataset
 * @param {Array} columns - The columns in the dataset
 * @param {Object} stats - Statistics for each column
 * @returns {Object} - Recommended chart type and configuration
 */
exports.recommendChartType = async (data, columns, stats) => {
  try {
    // 🅳 - Detect data types for each column
    const columnTypes = detectDataTypes(data, columns, stats);
    
    // 🅰 - Analyze patterns and relationships between columns
    const patterns = analyzePatterns(data, columnTypes, stats);
    
    // 🆃 - Tag and recommend visualizations
    const recommendations = tagRecommendations(patterns, columnTypes);
    
    // Get the best chart type (first in the ranked list)
    const bestRecommendation = recommendations[0] || {
      chart: 'bar',
      columns: columns.slice(0, 2),
      confidence: 0.7,
      reason: 'Default recommendation based on available data'
    };
    
    // Configure the chart parameters
    const config = configureChart(
      bestRecommendation.chart, 
      bestRecommendation.columns, 
      columnTypes, 
      data
    );
    
    return {
      chartType: bestRecommendation.chart,
      config,
      explanation: bestRecommendation.reason,
      recommendations: recommendations.map(rec => ({
        chartType: rec.chart,
        confidence: Math.round(rec.confidence * 100),
        reason: rec.reason,
        columns: rec.columns
      }))
    };
  } catch (error) {
    console.error('AI chart recommendation error:', error);
    
    // Fallback to a sensible default with dynamic chart recommendations
    return {
      chartType: 'bar',
      config: {
        xAxis: { field: columns[0], label: columns[0] },
        yAxis: { field: columns[1] || columns[0], label: columns[1] || columns[0] },
        title: 'Data Visualization'
      },
      explanation: 'Using default bar chart due to error in analysis. Try adjusting your dataset for better recommendations.',
      recommendations: [
        { chartType: 'bar', confidence: 70, reason: 'Default recommendation (bar chart)' },
        { chartType: 'line', confidence: 60, reason: 'Alternative visualization option' },
        { chartType: 'pie', confidence: 50, reason: 'Alternative visualization option' },
        { chartType: 'scatter', confidence: 40, reason: 'Alternative visualization option' }
      ]
    };
  }
};

/**
 * 🅳 - Detect data types for each column
 * @param {Array} data - Dataset
 * @param {Array} columns - Column names
 * @param {Object} stats - Column statistics
 * @returns {Object} - Column type mappings with confidence
 */
function detectDataTypes(data, columns, stats) {
  const columnTypes = {};
  const sampleSize = Math.min(100, data.length);
  
  columns.forEach(column => {
    // Get sample values
    const sampleValues = data
      .slice(0, sampleSize)
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined);
    
    if (sampleValues.length === 0) {
      columnTypes[column] = { 
        type: 'unknown',
        confidence: 0
      };
      return;
    }
    
    // Numeric detection
    const numericCount = sampleValues.filter(val => !isNaN(parseFloat(val)) && isFinite(val)).length;
    const numericPercentage = numericCount / sampleValues.length;
    
    // Date detection
    const dateCount = sampleValues.filter(val => isValidDate(val)).length;
    const datePercentage = dateCount / sampleValues.length;
    
    // Unique values analysis
    const uniqueValues = new Set(sampleValues);
    const uniqueCount = uniqueValues.size;
    const uniqueRatio = uniqueCount / data.length;
    
    // Determine column type based on the detection criteria
    let detectedType;
    let confidence;
    
    if (numericPercentage > 0.9) {
      // If >90% values are numeric → type is "numerical"
      detectedType = "numerical";
      confidence = numericPercentage;
    } else if (datePercentage > 0.8) {
      // If values are parsable as valid dates → type is "datetime"
      detectedType = "datetime";
      confidence = datePercentage;
    } else if (uniqueRatio > 0.9) {
      // If column has unique values ≈ total rows → consider it as "identifier"
      detectedType = "identifier";
      confidence = uniqueRatio;
    } else {
      // If <15 unique values or mostly text → type is "categorical"
      detectedType = "categorical";
      confidence = uniqueCount <= 15 ? 
        0.9 : 
        Math.max(0.6, 1 - (uniqueCount / 50)); // Lower confidence as unique count increases
    }
    
    columnTypes[column] = {
      type: detectedType,
      confidence: confidence,
      uniqueCount: uniqueCount,
      uniqueRatio: uniqueRatio,
      values: Array.from(uniqueValues).slice(0, 20) // Store sample of unique values
    };
  });
  
  return columnTypes;
}

/**
 * Check if values could be month names
 * @param {Array} values - Array of values to check
 * @returns {boolean} - True if column contains month names
 */
function isMonthNameColumn(values) {
  if (!values || values.length === 0) return false;
  
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  
  const sampleSize = Math.min(values.length, 12); // Check at most 12 values
  let monthCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const value = String(values[i]).toLowerCase();
    if (monthNames.includes(value)) {
      monthCount++;
    }
  }
  
  // Return true if most values are month names
  return (monthCount / sampleSize) >= 0.5;
}

/**
 * 🅰 - Analyze patterns and relationships between columns
 * @param {Array} data - Dataset
 * @param {Object} columnTypes - Column type data
 * @param {Object} stats - Column statistics
 * @returns {Object} - Detected patterns and relationships
 */
function analyzePatterns(data, columnTypes, stats) {
  const patterns = {
    timeSeriesColumns: [],
    correlatedColumns: [],
    columnPairs: [],
    columnTrios: []
  };
  
  // Group columns by type
  const columnsByType = {
    numerical: [],
    categorical: [],
    datetime: [],
    identifier: []
  };
  
  Object.entries(columnTypes).forEach(([column, info]) => {
    if (info.type in columnsByType) {
      columnsByType[info.type].push(column);
    }
  });
  
  // First check for month columns - they should be treated as datetime
  Object.entries(columnTypes).forEach(([column, info]) => {
    if (info.type === 'categorical') {
      const values = data.map(row => row[column]);
      if (isMonthNameColumn(values)) {
        // Add this to datetime columns even though it's categorized as categorical
        columnsByType.datetime.push(column);
        
        // Mark it as a time series column with special handling
        patterns.timeSeriesColumns.push({
          column,
          isMonotonic: true,
          hasRegularIntervals: true,
          isMonthColumn: true
        });
      }
    }
  });
  
  // Detect time series patterns in datetime columns
  columnsByType.datetime.forEach(column => {
    // Skip if we already detected this as a month column
    if (patterns.timeSeriesColumns.some(ts => ts.column === column && ts.isMonthColumn)) {
      return;
    }
    
    // Extract datetime values
    const dateValues = data
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined)
      .map(val => new Date(val))
      .filter(date => !isNaN(date.getTime()));
    
    if (dateValues.length >= 5) {
      // Sort dates
      dateValues.sort((a, b) => a - b);
      
      // Check for monotonic increase
      let isMonotonic = true;
      for (let i = 1; i < dateValues.length; i++) {
        if (dateValues[i] <= dateValues[i-1]) {
          isMonotonic = false;
          break;
        }
      }
      
      // Check for regular intervals
      let hasRegularIntervals = false;
      if (dateValues.length >= 3) {
        const intervals = [];
        for (let i = 1; i < dateValues.length; i++) {
          intervals.push(dateValues[i] - dateValues[i-1]);
        }
        
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // If standard deviation is less than 25% of the average, consider it regular
        if (stdDev / avgInterval < 0.25) {
          hasRegularIntervals = true;
        }
      }
      
      if (isMonotonic || hasRegularIntervals) {
        patterns.timeSeriesColumns.push({
          column,
          isMonotonic,
          hasRegularIntervals
        });
      }
    }
  });
  
  // Find correlations between numeric columns
  if (columnsByType.numerical.length >= 2) {
    for (let i = 0; i < columnsByType.numerical.length; i++) {
      for (let j = i + 1; j < columnsByType.numerical.length; j++) {
        const col1 = columnsByType.numerical[i];
        const col2 = columnsByType.numerical[j];
        
        // Check if correlation data exists in stats
        let correlation = 0;
        if (stats[col1]?.correlations && stats[col1].correlations[col2]) {
          correlation = stats[col1].correlations[col2];
        } else {
          // Calculate basic correlation if not provided in stats
          correlation = calculateCorrelation(data, col1, col2);
        }
        
        patterns.correlatedColumns.push({
          columns: [col1, col2],
          correlation: correlation,
          strength: Math.abs(correlation)
        });
      }
    }
    
    // Sort by correlation strength
    patterns.correlatedColumns.sort((a, b) => b.strength - a.strength);
  }
  
  // Build valid column pairs for charts
  // Categorical + Numerical
  columnsByType.categorical.forEach(catCol => {
    columnsByType.numerical.forEach(numCol => {
      patterns.columnPairs.push({
        columns: [catCol, numCol],
        types: ["categorical", "numerical"]
      });
    });
  });
  
  // Datetime + Numerical
  columnsByType.datetime.forEach(dateCol => {
    columnsByType.numerical.forEach(numCol => {
      patterns.columnPairs.push({
        columns: [dateCol, numCol],
        types: ["datetime", "numerical"],
        isTimeSeries: patterns.timeSeriesColumns.some(ts => ts.column === dateCol)
      });
    });
  });
  
  // Numerical + Numerical (using correlations)
  patterns.correlatedColumns.forEach(pair => {
    patterns.columnPairs.push({
      columns: pair.columns,
      types: ["numerical", "numerical"],
      correlation: pair.correlation
    });
  });
  
  // Build valid column trios (Datetime + Categorical + Numerical)
  if (columnsByType.datetime.length > 0 && 
      columnsByType.categorical.length > 0 && 
      columnsByType.numerical.length > 0) {
    
    columnsByType.datetime.forEach(dateCol => {
      columnsByType.categorical.forEach(catCol => {
        // Only consider categories with reasonable number of values for grouping
        if (columnTypes[catCol].uniqueCount <= 10) {
          columnsByType.numerical.forEach(numCol => {
            patterns.columnTrios.push({
              columns: [dateCol, catCol, numCol],
              types: ["datetime", "categorical", "numerical"]
            });
          });
        }
      });
    });
  }
  
  return patterns;
}

/**
 * 🆃 - Tag and recommend visualizations based on patterns
 * @param {Object} patterns - Detected patterns
 * @param {Object} columnTypes - Column type data
 * @returns {Array} - Ranked chart recommendations
 */
function tagRecommendations(patterns, columnTypes) {
  const recommendations = [];
  
  // Process column pairs
  patterns.columnPairs.forEach(pair => {
    // Skip pairs with identifier columns
    if (pair.columns.some(col => columnTypes[col].type === "identifier")) {
      return;
    }
    
    const [col1, col2] = pair.columns;
    const [type1, type2] = pair.types;
    
    // Categorical + Numerical -> Bar Chart
    if (type1 === "categorical" && type2 === "numerical") {
      const uniqueCount = columnTypes[col1].uniqueCount;
      // Only consider reasonable number of categories
      if (uniqueCount <= 30) {
        recommendations.push({
          chart: "bar",
          columns: [col1, col2],
          confidence: calculateConfidence("bar", uniqueCount),
          reason: `Compare ${formatColumnName(col2)} values across different ${formatColumnName(col1)} categories`
        });
      }
    }
    
    // Datetime + Numerical -> Line Chart
    if (type1 === "datetime" && type2 === "numerical") {
      const isTimeSeries = pair.isTimeSeries;
      recommendations.push({
        chart: "line",
        columns: [col1, col2],
        confidence: isTimeSeries ? 0.98 : 0.85,
        reason: `Show trend of ${formatColumnName(col2)} over time (${formatColumnName(col1)})`
      });
    }
    
    // Numerical + Numerical -> Scatter Plot
    if (type1 === "numerical" && type2 === "numerical") {
      recommendations.push({
        chart: "scatter",
        columns: [col1, col2],
        confidence: 0.5 + (Math.abs(pair.correlation || 0) * 0.4), // Scale correlation to confidence
        reason: `Show relationship between ${formatColumnName(col1)} and ${formatColumnName(col2)}` +
               (pair.correlation && Math.abs(pair.correlation) > 0.5 ? 
                ` (correlation: ${pair.correlation.toFixed(2)})` : '')
      });
    }
  });
  
  // Process single categorical columns for pie charts
  Object.entries(columnTypes).forEach(([column, info]) => {
    if (info.type === "categorical" && info.type !== "identifier") {
      const uniqueCount = info.uniqueCount;
      // Only recommend pie charts if there are not too many categories (<10)
      if (uniqueCount <= 10) {
        recommendations.push({
          chart: "pie",
          columns: [column],
          confidence: calculateConfidence("pie", uniqueCount),
          reason: `Show distribution of ${formatColumnName(column)} values as parts of a whole`
        });
      }
    }
  });
  
  // Process column trios for multi-series charts
  patterns.columnTrios.forEach(trio => {
    // Skip trios with identifier columns
    if (trio.columns.some(col => columnTypes[col].type === "identifier")) {
      return;
    }
    
    const [dateCol, catCol, numCol] = trio.columns;
    
    recommendations.push({
      chart: "line", // Multi-line chart
      columns: [dateCol, catCol, numCol],
      confidence: 0.85,
      reason: `Compare ${formatColumnName(numCol)} across different ${formatColumnName(catCol)} categories over time (${formatColumnName(dateCol)})`
    });
  });
  
  // Sort by confidence (highest first)
  recommendations.sort((a, b) => b.confidence - a.confidence);
  
  // Return top recommendations (max 3 per chart type)
  const topRecommendations = [];
  const chartCounts = { bar: 0, line: 0, scatter: 0, pie: 0 };
  
  recommendations.forEach(rec => {
    if (chartCounts[rec.chart] < 3) {
      topRecommendations.push(rec);
      chartCounts[rec.chart]++;
    }
  });
  
  // Ensure we return at least one recommendation of each type if available
  for (const chartType of ['bar', 'line', 'scatter', 'pie']) {
    if (chartCounts[chartType] === 0) {
      const rec = recommendations.find(r => r.chart === chartType);
      if (rec) {
        topRecommendations.push(rec);
      }
    }
  }
  
  // Return top recommendations overall (up to 10 total)
  return topRecommendations.slice(0, 10);
}

/**
 * Calculate confidence score for chart type based on characteristics
 * @param {string} chartType - Type of chart
 * @param {number} uniqueCount - Number of unique values
 * @returns {number} - Confidence score between 0 and 1
 */
function calculateConfidence(chartType, uniqueCount) {
  switch (chartType) {
    case 'bar':
      // Ideal: 5-15 categories
      if (uniqueCount <= 15) {
        return 0.9;
      } else if (uniqueCount <= 20) {
        return 0.8;
      } else if (uniqueCount <= 30) {
        return 0.7;
      } else {
        return 0.5;
      }
    
    case 'pie':
      // Ideal: 3-7 categories
      if (uniqueCount <= 7) {
        return 0.85;
      } else if (uniqueCount <= 10) {
        return 0.65;
      } else {
        return 0.4; // Low confidence for many categories
      }
      
    default:
      return 0.7;
  }
}

/**
 * Check if a value can be parsed as a valid date
 * @param {*} value - Value to check
 * @returns {boolean} - True if value is a valid date
 */
function isValidDate(value) {
  if (!value) return false;
  
  // If already a Date object
  if (value instanceof Date) return !isNaN(value);
  
  // Try to parse string to date
  if (typeof value === 'string') {
    // Common date formats
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or M/D/YYYY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO format
    ];
    
    if (datePatterns.some(pattern => pattern.test(value))) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    return false;
  }
  
  return false;
}

/**
 * Format column name to be more readable
 * @param {string} column - Original column name
 * @returns {string} - Formatted column name
 */
function formatColumnName(column) {
  return column
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());
}

/**
 * Calculate basic correlation between two numeric columns
 * @param {Array} data - Dataset
 * @param {string} col1 - First column name
 * @param {string} col2 - Second column name
 * @returns {number} - Correlation coefficient
 */
function calculateCorrelation(data, col1, col2) {
  // Extract numeric values
  const values = data
    .map(row => ({
      x: parseFloat(row[col1]),
      y: parseFloat(row[col2])
    }))
    .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));
  
  if (values.length < 5) return 0;
  
  // Calculate means
  const sumX = values.reduce((sum, pair) => sum + pair.x, 0);
  const sumY = values.reduce((sum, pair) => sum + pair.y, 0);
  const meanX = sumX / values.length;
  const meanY = sumY / values.length;
  
  // Calculate correlation coefficient
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  values.forEach(pair => {
    const diffX = pair.x - meanX;
    const diffY = pair.y - meanY;
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  });
  
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Configure the chart based on the selected chart type
 * @param {string} chartType - The selected chart type
 * @param {Array} columns - Columns to use for the chart
 * @param {Object} columnTypes - Column type data
 * @param {Array} data - Dataset for additional analysis
 * @returns {Object} - Chart configuration
 */
function configureChart(chartType, columns, columnTypes, data) {
  let config = {
    title: 'Data Visualization',
    subtitle: '',
    dimensions: { width: 800, height: 500 },
    colors: generateColorPalette(5)
  };
  
  switch (chartType) {
    case 'bar': {
      // For bar charts: categorical column as x-axis, numerical as y-axis
      const categoryCol = columns.find(col => columnTypes[col].type === 'categorical') || columns[0];
      const numericCol = columns.find(col => columnTypes[col].type === 'numerical') || columns[1] || columns[0];
      
      config.xAxis = { field: categoryCol, label: formatColumnName(categoryCol) };
      config.yAxis = { field: numericCol, label: formatColumnName(numericCol) };
      
      // If we have many categories, suggest a horizontal bar chart
      if (columnTypes[categoryCol].uniqueCount > 10) {
        config.orientation = 'horizontal';
      }
      break;
    }
    
    case 'line': {
      // For line charts: datetime or categorical as x-axis, numerical as y-axis
      const timeCol = columns.find(col => columnTypes[col].type === 'datetime');
      const categoryCol = columns.find(col => columnTypes[col].type === 'categorical');
      const numericCol = columns.find(col => columnTypes[col].type === 'numerical');
      
      const xAxisCol = timeCol || categoryCol || columns[0];
      const yAxisCol = numericCol || columns[1] || columns[0];
      
      config.xAxis = { field: xAxisCol, label: formatColumnName(xAxisCol) };
      config.yAxis = { field: yAxisCol, label: formatColumnName(yAxisCol) };
      
      // If we have 3 columns, set up multi-line chart with grouping
      if (columns.length >= 3) {
        const groupCol = columns.find(col => 
          col !== xAxisCol && col !== yAxisCol && columnTypes[col].type === 'categorical');
        
        if (groupCol) {
          config.groupBy = { field: groupCol, label: formatColumnName(groupCol) };
        }
      }
      break;
    }
    
    case 'scatter': {
      // For scatter plots: both axes should be numerical
      const numericCols = columns.filter(col => columnTypes[col].type === 'numerical');
      
      config.xAxis = { 
        field: numericCols[0] || columns[0], 
        label: formatColumnName(numericCols[0] || columns[0]) 
      };
      
      config.yAxis = { 
        field: numericCols[1] || numericCols[0] || columns[1] || columns[0], 
        label: formatColumnName(numericCols[1] || numericCols[0] || columns[1] || columns[0]) 
      };
      
      // If we have a third column that's categorical, use it for color coding
      const categoryCol = columns.find(col => columnTypes[col].type === 'categorical');
      if (categoryCol) {
        config.colorBy = { field: categoryCol, label: formatColumnName(categoryCol) };
      }
      break;
    }
    
    case 'pie': {
      // For pie charts: categorical for segments, optional numeric for values
      const categoryCol = columns.find(col => columnTypes[col].type === 'categorical') || columns[0];
      const numericCol = columns.find(col => columnTypes[col].type === 'numerical');
      
      config.segments = { field: categoryCol, label: formatColumnName(categoryCol) };
      
      if (numericCol) {
        config.values = { field: numericCol, label: formatColumnName(numericCol) };
      } else {
        config.values = { field: 'count', label: 'Count' };
      }
      break;
    }
  }
  
  return config;
}

/**
 * Generate a color palette
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color hex codes
 */
function generateColorPalette(count) {
  // Modern color palette
  const baseColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1'  // indigo
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length]);
  }
  
  return result;
} 