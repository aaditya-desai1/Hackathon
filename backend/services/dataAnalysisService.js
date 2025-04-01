const { parseCSV, parseJSON, analyzeDataColumns } = require('../utils/dataParser');

class DataAnalysisService {
  async analyzeFile(filePath, fileType) {
    try {
      let data;
      let columns;

      // Parse the file based on its type
      if (fileType === 'text/csv') {
        const result = await parseCSV(filePath);
        data = result.data;
        columns = result.columns;
      } else if (fileType === 'application/json') {
        const result = await parseJSON(filePath);
        data = result.data;
        columns = result.columns;
      } else {
        throw new Error('Unsupported file type');
      }

      // Perform basic column analysis
      const columnAnalysis = analyzeDataColumns(data, columns);

      // Perform advanced analysis
      const advancedAnalysis = await this.performAdvancedAnalysis(data, columns);

      return {
        basicAnalysis: columnAnalysis,
        advancedAnalysis,
        summary: {
          totalRows: data.length,
          totalColumns: columns.length,
          fileType,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  async performAdvancedAnalysis(data, columns) {
    const analysis = {};

    // Analyze correlations between numeric columns
    const numericColumns = columns.filter(col => {
      const values = data.map(row => row[col]);
      return values.every(val => !isNaN(val) && val !== null);
    });

    if (numericColumns.length > 1) {
      analysis.correlations = this.calculateCorrelations(data, numericColumns);
    }

    // Analyze value distributions
    analysis.distributions = {};
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      analysis.distributions[column] = this.analyzeDistribution(values);
    });

    // Detect outliers in numeric columns
    analysis.outliers = {};
    numericColumns.forEach(column => {
      const values = data.map(row => parseFloat(row[column]));
      analysis.outliers[column] = this.detectOutliers(values);
    });

    return analysis;
  }

  calculateCorrelations(data, numericColumns) {
    const correlations = {};
    
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        const values1 = data.map(row => parseFloat(row[col1]));
        const values2 = data.map(row => parseFloat(row[col2]));
        
        correlations[`${col1}_${col2}`] = this.pearsonCorrelation(values1, values2);
      }
    }

    return correlations;
  }

  pearsonCorrelation(x, y) {
    const n = x.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  analyzeDistribution(values) {
    const distribution = {
      uniqueValues: new Set(values).size,
      valueCounts: {},
      mostCommon: [],
      leastCommon: []
    };

    // Count occurrences of each value
    values.forEach(value => {
      const key = value === null ? 'null' : value.toString();
      distribution.valueCounts[key] = (distribution.valueCounts[key] || 0) + 1;
    });

    // Sort values by frequency
    const sortedValues = Object.entries(distribution.valueCounts)
      .sort((a, b) => b[1] - a[1]);

    // Get most and least common values
    distribution.mostCommon = sortedValues.slice(0, 5);
    distribution.leastCommon = sortedValues.slice(-5).reverse();

    return distribution;
  }

  detectOutliers(values) {
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = this.quartile(sortedValues, 0.25);
    const q3 = this.quartile(sortedValues, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return {
      outliers: values.filter(value => value < lowerBound || value > upperBound),
      bounds: {
        lower: lowerBound,
        upper: upperBound
      }
    };
  }

  quartile(sortedValues, q) {
    const pos = (sortedValues.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sortedValues[base + 1] !== undefined) {
      return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
    } else {
      return sortedValues[base];
    }
  }
}

module.exports = new DataAnalysisService(); 