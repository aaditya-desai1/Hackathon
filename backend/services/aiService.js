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
    // Analyze the dataset characteristics
    const datasetCharacteristics = analyzeDatasetCharacteristics(data, columns, stats);
    
    // Identify the most suitable chart type
    const chartTypeAndReason = identifyChartType(datasetCharacteristics);
    
    // Configure the chart parameters
    const config = configureChart(chartTypeAndReason.chartType, datasetCharacteristics, columns, stats);
    
    return {
      chartType: chartTypeAndReason.chartType,
      config,
      explanation: chartTypeAndReason.reason
    };
  } catch (error) {
    console.error('AI chart recommendation error:', error);
    
    // Fallback to a sensible default
    return {
      chartType: 'bar',
      config: {
        xAxis: { field: columns[0], label: columns[0] },
        yAxis: { field: columns[1] || columns[0], label: columns[1] || columns[0] },
        title: 'Data Visualization'
      },
      explanation: 'Using default bar chart due to error in analysis. Try adjusting your dataset for better recommendations.'
    };
  }
};

/**
 * Analyze dataset characteristics
 * @param {Array} data - The dataset
 * @param {Array} columns - The columns in the dataset
 * @param {Object} stats - Statistics for each column
 * @returns {Object} - Dataset characteristics
 */
function analyzeDatasetCharacteristics(data, columns, stats) {
  const characteristics = {
    rowCount: data.length,
    columnCount: columns.length,
    numericColumns: [],
    categoricalColumns: [],
    dateColumns: [],
    textColumns: [],
    booleanColumns: [],
    timeSeriesData: false,
    hasManyCategories: false,
    hasCorrelation: false,
    correlatedColumns: [],
    hierarchicalData: false,
    geospatialData: false,
    compositionalData: false,
    distributionData: false
  };
  
  // Classify columns
  columns.forEach(column => {
    const columnStats = stats[column];
    if (!columnStats) return;
    
    if (columnStats.type === 'number') {
      characteristics.numericColumns.push(column);
      
      // Check if it looks like a distribution
      if (columnStats.histogram && 
          columnStats.histogram.length > 5 && 
          Math.abs(columnStats.skewness) < 0.5) {
        characteristics.distributionData = true;
      }
    } else if (columnStats.type === 'string') {
      if (columnStats.isCategorical) {
        characteristics.categoricalColumns.push(column);
        
        // Check if there are many categories
        if (columnStats.uniqueCount > 10) {
          characteristics.hasManyCategories = true;
        }
        
        // Check if it could be hierarchical (contains delimiters)
        if (columnStats.mostCommon && 
            columnStats.mostCommon.some(item => 
              String(item.value).includes('/') || 
              String(item.value).includes('>') || 
              String(item.value).includes('->'))) {
          characteristics.hierarchicalData = true;
        }
      } else if (columnStats.couldBeDate) {
        characteristics.dateColumns.push(column);
        
        // Check if this looks like time series data
        if (data.length > 5 && columnStats.uniqueCount > data.length * 0.8) {
          characteristics.timeSeriesData = true;
        }
      } else {
        characteristics.textColumns.push(column);
      }
      
      // Check for possible geospatial data
      if (column.toLowerCase().includes('country') || 
          column.toLowerCase().includes('state') || 
          column.toLowerCase().includes('city') || 
          column.toLowerCase().includes('region')) {
        characteristics.geospatialData = true;
      }
    } else if (columnStats.type === 'boolean') {
      characteristics.booleanColumns.push(column);
    }
  });
  
  // Check for correlations between numeric columns
  const numericColumns = characteristics.numericColumns;
  for (let i = 0; i < numericColumns.length; i++) {
    const column = numericColumns[i];
    if (stats[column].correlations) {
      for (const [otherColumn, correlation] of Object.entries(stats[column].correlations)) {
        if (Math.abs(correlation) > 0.7) {  // Strong correlation
          characteristics.hasCorrelation = true;
          characteristics.correlatedColumns.push([column, otherColumn, correlation]);
        }
      }
    }
  }
  
  // Check if this could be compositional data (parts of a whole)
  if (numericColumns.length > 1 && categoricalColumns.length > 0) {
    const sums = data.map(row => 
      numericColumns.reduce((sum, col) => sum + (Number(row[col]) || 0), 0)
    );
    
    // If the sums are close to 100 or 1, it might be compositional
    const avgSum = sums.reduce((sum, val) => sum + val, 0) / sums.length;
    if (Math.abs(avgSum - 100) < 5 || Math.abs(avgSum - 1) < 0.1) {
      characteristics.compositionalData = true;
    }
  }
  
  return characteristics;
}

/**
 * Identify the best chart type based on dataset characteristics
 * @param {Object} characteristics - Dataset characteristics
 * @returns {Object} - Recommended chart type and reason
 */
function identifyChartType(characteristics) {
  const {
    rowCount,
    columnCount,
    numericColumns,
    categoricalColumns,
    dateColumns,
    timeSeriesData,
    hasManyCategories,
    hasCorrelation,
    correlatedColumns,
    hierarchicalData,
    geospatialData,
    compositionalData,
    distributionData
  } = characteristics;
  
  // Time Series Data
  if (timeSeriesData && numericColumns.length >= 1) {
    return {
      chartType: 'line',
      reason: 'Line chart recommended for time series data to show trends over time.'
    };
  }
  
  // Correlation Analysis
  if (hasCorrelation && correlatedColumns.length > 0) {
    return {
      chartType: 'scatter',
      reason: 'Scatter plot recommended to visualize correlation between numeric variables.'
    };
  }
  
  // Distribution Analysis
  if (distributionData && numericColumns.length >= 1) {
    return {
      chartType: 'histogram',
      reason: 'Histogram recommended to visualize distribution of numeric values.'
    };
  }
  
  // Compositional Data
  if (compositionalData) {
    if (categoricalColumns.length === 1 && categoricalColumns[0].uniqueCount <= 7) {
      return {
        chartType: 'pie',
        reason: 'Pie chart recommended for compositional data with few categories.'
      };
    } else {
      return {
        chartType: 'bar',
        reason: 'Stacked bar chart recommended for compositional data with multiple categories.'
      };
    }
  }
  
  // Categorical Comparison
  if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
    if (hasManyCategories) {
      return {
        chartType: 'bar',
        reason: 'Horizontal bar chart recommended for comparing many categories.'
      };
    } else {
      return {
        chartType: 'bar',
        reason: 'Bar chart recommended for comparing categories.'
      };
    }
  }
  
  // Hierarchical Data
  if (hierarchicalData) {
    return {
      chartType: 'heatmap',
      reason: 'Heatmap recommended for hierarchical data structure.'
    };
  }
  
  // Multiple Numeric Comparisons
  if (numericColumns.length >= 2 && categoricalColumns.length >= 1) {
    return {
      chartType: 'radar',
      reason: 'Radar chart recommended for comparing multiple numeric metrics across categories.'
    };
  }
  
  // Simple Time Series
  if (dateColumns.length >= 1 && numericColumns.length >= 1) {
    return {
      chartType: 'line',
      reason: 'Line chart recommended for time-based data.'
    };
  }
  
  // Fallback for other scenarios
  if (numericColumns.length >= 1) {
    return {
      chartType: 'bar',
      reason: 'Bar chart recommended as a default visualization for your data structure.'
    };
  }
  
  // If nothing else fits
  return {
    chartType: 'bar',
    reason: 'Bar chart recommended as a general visualization for your data.'
  };
}

/**
 * Configure the chart based on the selected chart type
 * @param {string} chartType - The selected chart type
 * @param {Object} characteristics - Dataset characteristics
 * @param {Array} columns - Available columns
 * @param {Object} stats - Column statistics
 * @returns {Object} - Chart configuration
 */
function configureChart(chartType, characteristics, columns, stats) {
  const {
    numericColumns,
    categoricalColumns,
    dateColumns,
    correlatedColumns
  } = characteristics;
  
  let config = {
    title: 'Data Visualization',
    subtitle: '',
    dimensions: { width: 800, height: 500 },
    colors: generateColorPalette(5)
  };
  
  switch (chartType) {
    case 'bar':
      if (categoricalColumns.length > 0) {
        config.xAxis = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      } else if (dateColumns.length > 0) {
        config.xAxis = { field: dateColumns[0], label: formatLabel(dateColumns[0]) };
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColumns.length > 0) {
        config.yAxis = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
      } else {
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // If we have many categories, suggest a horizontal bar chart
      if (characteristics.hasManyCategories) {
        config.orientation = 'horizontal';
      }
      
      // Suggest grouping if we have multiple numeric columns
      if (numericColumns.length > 1 && categoricalColumns.length > 0) {
        config.groupBy = numericColumns[1];
      }
      break;
      
    case 'line':
      if (dateColumns.length > 0) {
        config.xAxis = { field: dateColumns[0], label: formatLabel(dateColumns[0]) };
      } else if (categoricalColumns.length > 0) {
        config.xAxis = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColumns.length > 0) {
        config.yAxis = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
      } else {
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // Multi-line chart if we have multiple numeric columns
      if (numericColumns.length > 1) {
        config.series = numericColumns.map(col => ({ 
          field: col, 
          label: formatLabel(col) 
        }));
      }
      break;
      
    case 'scatter':
      if (correlatedColumns.length > 0) {
        // Use the correlated columns
        const [col1, col2] = correlatedColumns[0];
        config.xAxis = { field: col1, label: formatLabel(col1) };
        config.yAxis = { field: col2, label: formatLabel(col2) };
      } else if (numericColumns.length >= 2) {
        // Use the first two numeric columns
        config.xAxis = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
        config.yAxis = { field: numericColumns[1], label: formatLabel(numericColumns[1]) };
      } else {
        // Fallback
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // If we have a third numeric column, use it for bubble size
      if (numericColumns.length >= 3) {
        config.bubbleSize = { field: numericColumns[2], label: formatLabel(numericColumns[2]) };
      }
      
      // If we have categories, use them for color coding
      if (categoricalColumns.length > 0) {
        config.colorBy = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      }
      break;
      
    case 'pie':
      if (categoricalColumns.length > 0) {
        config.segments = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      } else {
        config.segments = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColumns.length > 0) {
        config.values = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
      } else {
        config.values = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      break;
      
    case 'histogram':
      if (numericColumns.length > 0) {
        config.xAxis = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
        config.bins = 10; // Default number of bins
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
        config.bins = 5;
      }
      
      config.yAxis = { label: 'Frequency' };
      break;
      
    case 'heatmap':
      if (categoricalColumns.length >= 2) {
        config.xAxis = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
        config.yAxis = { field: categoricalColumns[1], label: formatLabel(categoricalColumns[1]) };
      } else if (categoricalColumns.length >= 1 && dateColumns.length >= 1) {
        config.xAxis = { field: dateColumns[0], label: formatLabel(dateColumns[0]) };
        config.yAxis = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      if (numericColumns.length > 0) {
        config.values = { field: numericColumns[0], label: formatLabel(numericColumns[0]) };
      } else {
        config.values = { field: 'count', label: 'Count' };
      }
      break;
      
    case 'radar':
      if (categoricalColumns.length > 0) {
        config.categories = { field: categoricalColumns[0], label: formatLabel(categoricalColumns[0]) };
      } else {
        config.categories = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColumns.length > 0) {
        config.metrics = numericColumns.map(col => ({ 
          field: col, 
          label: formatLabel(col) 
        }));
      } else {
        config.metrics = [{ field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) }];
      }
      break;
      
    default:
      // Default configuration for other chart types
      config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
      config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
  }
  
  return config;
}

/**
 * Format a column name as a friendly label
 * @param {string} columnName - The column name
 * @returns {string} - Formatted label
 */
function formatLabel(columnName) {
  // Replace underscores and camelCase with spaces
  return columnName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Generate a color palette
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color hex codes
 */
function generateColorPalette(count) {
  // Some predefined color palettes
  const palettes = {
    qualitative: [
      '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
      '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
    ],
    sequential: [
      '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5',
      '#08519c', '#08306b'
    ],
    diverging: [
      '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf',
      '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'
    ]
  };
  
  // Choose a palette based on the chart type and data
  const palette = palettes.qualitative;
  
  // Return the requested number of colors
  return palette.slice(0, count);
} 