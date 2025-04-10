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
    // Analyze the dataset characteristics using the DAT algorithm
    const datasetCharacteristics = analyzeDatasetCharacteristics(data, columns, stats);
    
    // Identify the most suitable chart types and rank them
    const chartRecommendations = identifyChartTypes(datasetCharacteristics);
    
    // Get the best chart type (first in the ranked list)
    const bestChartType = chartRecommendations[0];
    
    // Configure the chart parameters
    const config = configureChart(bestChartType.chartType, datasetCharacteristics, columns, stats);
    
    return {
      chartType: bestChartType.chartType,
      config,
      explanation: bestChartType.reason,
      recommendations: chartRecommendations
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
 * Analyze dataset characteristics using the DAT algorithm
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
  
  // 🅳 - DETECT DATA TYPES: Parse columns and infer data types
  columns.forEach(column => {
    const columnStats = stats[column];
    if (!columnStats) return;
    
    // Classify column based on its type
    if (columnStats.type === 'number') {
      characteristics.numericColumns.push({
        name: column,
        uniqueCount: columnStats.uniqueCount || 0,
        min: columnStats.min,
        max: columnStats.max
      });
      
      // Check if it looks like a distribution
      if (columnStats.histogram && 
          columnStats.histogram.length > 5 && 
          Math.abs(columnStats.skewness) < 0.5) {
        characteristics.distributionData = true;
      }
    } else if (columnStats.type === 'string') {
      // 🅰 - ANALYZE PATTERNS: Count unique values per column
      const uniqueCount = columnStats.uniqueCount || 0;
      const uniqueRatio = uniqueCount / characteristics.rowCount;
      
      // If unique values < 10 → Categorical
      // If > 90% values are unique → Likely not categorical
      if (uniqueCount < 10 || uniqueRatio < 0.1) {
        characteristics.categoricalColumns.push({
          name: column,
          uniqueCount: uniqueCount
        });
        
        // Check if there are many categories
        if (uniqueCount > 10) {
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
        characteristics.dateColumns.push({
          name: column,
          uniqueCount: uniqueCount
        });
        
        // Check for time series patterns (e.g., monotonic Date)
        if (data.length > 5 && uniqueCount > data.length * 0.8) {
          characteristics.timeSeriesData = true;
        }
      } else {
        characteristics.textColumns.push({
          name: column,
          uniqueCount: uniqueCount
        });
      }
      
      // Check for possible geospatial data
      if (column.toLowerCase().includes('country') || 
          column.toLowerCase().includes('state') || 
          column.toLowerCase().includes('city') || 
          column.toLowerCase().includes('region')) {
        characteristics.geospatialData = true;
      }
    } else if (columnStats.type === 'boolean') {
      characteristics.booleanColumns.push({
        name: column
      });
    }
  });
  
  // Check for correlations between numeric columns (part of analyzing patterns)
  const numericColNames = characteristics.numericColumns.map(col => col.name);
  for (let i = 0; i < numericColNames.length; i++) {
    const column = numericColNames[i];
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
  if (numericColNames.length > 1 && characteristics.categoricalColumns.length > 0) {
    const sums = data.map(row => 
      numericColNames.reduce((sum, col) => sum + (Number(row[col]) || 0), 0)
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
 * Identify and rank the best chart types based on dataset characteristics
 * 🆃 - TAG COMMON USE CASES: Based on combinations of data types
 * @param {Object} characteristics - Dataset characteristics
 * @returns {Array} - Ranked chart type recommendations with confidence scores
 */
function identifyChartTypes(characteristics) {
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
  
  // Array to hold chart recommendations with confidence scores
  let recommendations = [];
  
  // [Time vs Number] → Line Chart
  if (timeSeriesData && numericColumns.length >= 1) {
    recommendations.push({
      chartType: 'line',
      confidence: 95,
      reason: 'Line chart recommended for time series data to show trends over time.'
    });
  }
  
  // [Two Numbers] and [Correlation] → Scatter Plot
  if (hasCorrelation && correlatedColumns.length > 0) {
    recommendations.push({
      chartType: 'scatter',
      confidence: 90,
      reason: 'Scatter plot recommended to visualize correlation between numeric variables.'
    });
  } else if (numericColumns.length >= 2) {
    recommendations.push({
      chartType: 'scatter',
      confidence: 75,
      reason: 'Scatter plot can show relationship between two numeric variables.'
    });
  }
  
  // [Category vs Number] → Bar Chart
  if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
    const confidence = hasManyCategories ? 85 : 90;
    recommendations.push({
      chartType: 'bar',
      confidence: confidence,
      reason: hasManyCategories 
        ? 'Bar chart recommended for comparing many categories.' 
        : 'Bar chart recommended for comparing values across categories.'
    });
  }
  
  // [One Categorical only] → Pie Chart
  if (categoricalColumns.length >= 1 && categoricalColumns[0].uniqueCount <= 7 && compositionalData) {
    recommendations.push({
      chartType: 'pie',
      confidence: 80,
      reason: 'Pie chart recommended for showing proportions with few categories.'
    });
  } else if (categoricalColumns.length >= 1 && categoricalColumns[0].uniqueCount <= 10) {
    recommendations.push({
      chartType: 'pie',
      confidence: 65,
      reason: 'Pie chart can show distribution across limited categories.'
    });
  }
  
  // Add default recommendations if none found yet
  if (recommendations.length === 0) {
    if (numericColumns.length >= 1 && categoricalColumns.length >= 1) {
      recommendations.push({
        chartType: 'bar',
        confidence: 70,
        reason: 'Bar chart recommended as default for categorical and numerical data.'
      });
    } else if (numericColumns.length >= 2) {
      recommendations.push({
        chartType: 'scatter',
        confidence: 65,
        reason: 'Scatter plot recommended as default for multiple numeric columns.'
      });
    } else if (dateColumns.length >= 1 && numericColumns.length >= 1) {
      recommendations.push({
        chartType: 'line',
        confidence: 70,
        reason: 'Line chart recommended as default for date and numeric data.'
      });
    } else {
      recommendations.push({
        chartType: 'bar',
        confidence: 60,
        reason: 'Bar chart recommended as a general visualization for your data.'
      });
    }
  }
  
  // Make sure we have recommendations for all supported chart types
  const chartTypes = recommendations.map(rec => rec.chartType);
  
  if (!chartTypes.includes('bar')) {
    recommendations.push({
      chartType: 'bar',
      confidence: 50,
      reason: 'Bar chart alternative for your data.'
    });
  }
  
  if (!chartTypes.includes('line')) {
    recommendations.push({
      chartType: 'line',
      confidence: 45,
      reason: 'Line chart alternative for your data.'
    });
  }
  
  if (!chartTypes.includes('pie')) {
    recommendations.push({
      chartType: 'pie',
      confidence: 40,
      reason: 'Pie chart alternative for your data.'
    });
  }
  
  if (!chartTypes.includes('scatter')) {
    recommendations.push({
      chartType: 'scatter',
      confidence: 35,
      reason: 'Scatter plot alternative for your data.'
    });
  }
  
  // Sort by confidence score (highest first)
  return recommendations.sort((a, b) => b.confidence - a.confidence);
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
  
  // Extract column names from the objects
  const numericColNames = numericColumns.map(col => col.name);
  const categoricalColNames = categoricalColumns.map(col => col.name);
  const dateColNames = dateColumns.map(col => col.name);
  
  switch (chartType) {
    case 'bar':
      if (categoricalColNames.length > 0) {
        config.xAxis = { field: categoricalColNames[0], label: formatLabel(categoricalColNames[0]) };
      } else if (dateColNames.length > 0) {
        config.xAxis = { field: dateColNames[0], label: formatLabel(dateColNames[0]) };
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColNames.length > 0) {
        config.yAxis = { field: numericColNames[0], label: formatLabel(numericColNames[0]) };
      } else {
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // If we have many categories, suggest a horizontal bar chart
      if (characteristics.hasManyCategories) {
        config.orientation = 'horizontal';
      }
      
      // Suggest grouping if we have multiple numeric columns
      if (numericColNames.length > 1 && categoricalColNames.length > 0) {
        config.groupBy = numericColNames[1];
      }
      break;
      
    case 'line':
      if (dateColNames.length > 0) {
        config.xAxis = { field: dateColNames[0], label: formatLabel(dateColNames[0]) };
      } else if (categoricalColNames.length > 0) {
        config.xAxis = { field: categoricalColNames[0], label: formatLabel(categoricalColNames[0]) };
      } else {
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColNames.length > 0) {
        config.yAxis = { field: numericColNames[0], label: formatLabel(numericColNames[0]) };
      } else {
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // Multi-line chart if we have multiple numeric columns
      if (numericColNames.length > 1) {
        config.series = numericColNames.map(col => ({ 
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
      } else if (numericColNames.length >= 2) {
        // Use the first two numeric columns
        config.xAxis = { field: numericColNames[0], label: formatLabel(numericColNames[0]) };
        config.yAxis = { field: numericColNames[1], label: formatLabel(numericColNames[1]) };
      } else {
        // Fallback
        config.xAxis = { field: columns[0], label: formatLabel(columns[0]) };
        config.yAxis = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
      }
      
      // If we have a third numeric column, use it for bubble size
      if (numericColNames.length >= 3) {
        config.bubbleSize = { field: numericColNames[2], label: formatLabel(numericColNames[2]) };
      }
      
      // If we have categories, use them for color coding
      if (categoricalColNames.length > 0) {
        config.colorBy = { field: categoricalColNames[0], label: formatLabel(categoricalColNames[0]) };
      }
      break;
      
    case 'pie':
      if (categoricalColNames.length > 0) {
        config.segments = { field: categoricalColNames[0], label: formatLabel(categoricalColNames[0]) };
      } else {
        config.segments = { field: columns[0], label: formatLabel(columns[0]) };
      }
      
      if (numericColNames.length > 0) {
        config.values = { field: numericColNames[0], label: formatLabel(numericColNames[0]) };
      } else {
        config.values = { field: columns[1] || columns[0], label: formatLabel(columns[1] || columns[0]) };
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
function formatLabel(text) {
  if (!text) return '';
  return text
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase());
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