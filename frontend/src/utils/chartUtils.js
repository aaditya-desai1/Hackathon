/**
 * Utility functions for chart operations
 */

import { Chart as ChartJS } from 'chart.js/auto';
import { getRandomColor } from './colorUtils';
import { fetchApi } from '../services/api';

/**
 * Generate chart configuration for Chart.js
 * @param {Object} chartData - Data for the chart
 * @param {string} chartType - Type of chart to generate
 * @returns {Object} Chart.js compatible configuration
 */
export const generateChartConfig = (chartData, chartType = 'bar') => {
  // Extract data
  const labels = chartData.labels || [];
  const values = chartData.values || [];
  
  // Generate random colors for each data point
  const colors = chartData.colors || Array(values.length).fill().map(() => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
  });
  
  // Create config object based on Chart.js structure
  return {
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType === 'pie' || chartType === 'doughnut',
          position: 'top',
        },
        title: {
          display: !!chartData.title,
          text: chartData.title || '',
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
        },
      },
      scales: (chartType === 'pie' || chartType === 'doughnut') ? undefined : {
        x: {
          title: {
            display: true,
            text: chartData.xAxisLabel || '',
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: chartData.yAxisLabel || '',
          },
          beginAtZero: true,
        },
      },
    },
    data: {
      labels,
      datasets: [{
        label: chartData.label || 'Data',
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
    
    // Build the query parameters for the API endpoint
    const queryParams = `?fileId=${chart.fileId}&yAxis=${chart.yAxis}${chart.xAxis ? `&xAxis=${chart.xAxis}` : ''}`;
    
    console.log(`Fetching chart data from API: /api/data/chart${queryParams}`);
    
    // Use the fetchApi utility that handles auth and base URL correctly
    const response = await fetchApi(`/api/data/chart${queryParams}`);
    
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