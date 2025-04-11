/**
 * Chart Utility Functions
 */

/**
 * Gets data from a chart instance
 * @param {Object} chartInstance The Chart.js instance
 * @param {string} chartType The type of chart
 * @returns {Object} The extracted labels, values and datasets
 */
export const extractDataFromChartInstance = (chartInstance, chartType) => {
  if (!chartInstance || !chartInstance.data) {
    return { labels: [], values: [], datasets: [] };
  }
  
  try {
    // Extract labels
    const labels = chartInstance.data.labels || [];
    
    // Extract values based on chart type
    let values = [];
    if (chartType === 'pie' || chartType === 'doughnut') {
      // For pie charts, values are in the first dataset's data
      values = chartInstance.data.datasets[0]?.data || [];
    } else {
      // For other charts, values are in the first dataset's data
      values = chartInstance.data.datasets[0]?.data || [];
    }
    
    // Extract datasets
    const datasets = chartInstance.data.datasets || [];
    
    return {
      labels,
      values,
      datasets
    };
  } catch (err) {
    console.error('Error extracting data from chart instance:', err);
    return { labels: [], values: [], datasets: [] };
  }
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