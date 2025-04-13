/**
 * Utility functions for chart operations
 */

import { Chart as ChartJS } from 'chart.js/auto';
import { getRandomColor, generateChartColors, getChartStyleConfig } from './colorUtils';
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
  
  // Generate modern colors for each data point using our utility
  const { colors, borderColors } = generateChartColors(values.length);
  
  // Get chart style for the specific chart type
  const chartStyle = getChartStyleConfig(chartType, values, chartData.label || 'Data');
  
  // Create datasets based on chart type
  const datasets = [{
    ...chartStyle,
    data: chartType === 'scatter' 
      ? values.map((value, index) => ({ x: labels[index], y: value }))
      : values
  }];
  
  // Create config object based on Chart.js structure
  return {
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: chartType === 'pie' || chartType === 'doughnut',
          position: 'top',
          labels: {
            font: {
              size: 13,
              family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
            },
            usePointStyle: true,
            boxWidth: 6,
            padding: 15
          }
        },
        title: {
          display: !!chartData.title,
          text: chartData.title || '',
          font: {
            size: 18,
            weight: 'bold',
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
          },
          padding: 20,
          color: '#333333'
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14,
            weight: 'bold',
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
          },
          bodyFont: {
            size: 13,
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
          },
          padding: 12,
          cornerRadius: 6,
          mode: 'index',
          intersect: false,
        },
      },
      scales: (chartType === 'pie' || chartType === 'doughnut') ? undefined : {
        x: {
          title: {
            display: true,
            text: chartData.xAxisLabel || '',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
            },
            color: '#555555',
            padding: { top: 10, bottom: 0 }
          },
          ticks: {
            font: {
              size: 12,
              family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
            },
            color: '#666666',
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: chartData.yAxisLabel || '',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
            },
            color: '#555555',
            padding: { top: 0, bottom: 10 }
          },
          ticks: {
            font: {
              size: 12,
              family: "'Roboto', 'Helvetica', 'Arial', sans-serif"
            },
            color: '#666666'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          beginAtZero: true
        },
      },
    },
    data: {
      labels,
      datasets
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