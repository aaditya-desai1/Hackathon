/**
 * Utility functions for chart operations
 */

import { Chart as ChartJS } from 'chart.js/auto';
import { getRandomColor } from './colorUtils';

/**
 * Generate chart configuration for Chart.js
 * @param {Object} chartData - Data for the chart
 * @param {string} chartType - Type of chart to generate
 * @returns {Object} Chart.js compatible configuration
 */
export const generateChartConfig = (chartData, chartType = 'bar') => {
  // Handle empty data case
  if (!chartData || !chartData.labels || !chartData.values) {
    console.error('Invalid chart data provided:', chartData);
    return {
      data: {
        labels: [],
        datasets: [{
          label: 'No data',
          data: [],
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }]
      }
    };
  }
  
  const { labels, values, datasets } = chartData;
  const colors = labels.map(() => getRandomColor());
  
  // If custom datasets are provided, use them
  if (datasets && datasets.length > 0) {
    return {
      data: {
        labels,
        datasets
      },
      type: chartType,
    };
  }
  
  // Otherwise build a default dataset
  return {
    data: {
      labels,
      datasets: [{
        label: 'Values',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    type: chartType,
  };
};

/**
 * Fetches chart data from the API
 * @param {Object} chart The chart configuration
 * @returns {Promise<Object>} The chart data from the API
 */
export const fetchChartDataFromAPI = async (chart) => {
  try {
    if (!chart || !chart.fileId || !chart.xAxis || !chart.yAxis) {
      throw new Error('Missing required chart data');
    }
    
    // Get auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required to fetch chart data');
    }
    
    // Prepare API URL - use the same logic as the API service
    const API_BASE_URL = process.env.REACT_APP_API_URL || 
                       (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
    let dataUrl = `${API_BASE_URL}/api/data/chart?fileId=${chart.fileId}&yAxis=${chart.yAxis}`;
    
    if (chart.xAxis) {
      dataUrl += `&xAxis=${chart.xAxis}`;
    }
    
    console.log(`Fetching chart data from API: ${dataUrl}`);
    
    const response = await fetch(dataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.chartData) {
        console.log('Retrieved chart data from API:', result.chartData);
        return {
          labels: result.chartData.labels || [],
          values: result.chartData.values || [],
          datasets: []
        };
      }
    }
    
    throw new Error(`Failed to fetch chart data: ${response.status}`);
  } catch (err) {
    console.error('Error fetching chart data from API:', err);
    return { labels: [], values: [], datasets: [] };
  }
};

export default {
  generateChartConfig,
  fetchChartDataFromAPI
}; 