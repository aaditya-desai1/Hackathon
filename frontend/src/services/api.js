/**
 * API service for handling API calls with environment-specific base URLs
 */

// Determine the API base URL based on the environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), use the /api prefix
    return '/api';
  }
  // In development, use the local backend
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Make a fetch request with the proper base URL
 * @param {string} endpoint - API endpoint (starting with /)
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchApi = async (endpoint, options = {}) => {
  // Remove /api prefix if it's already in the endpoint and we're in production
  const apiEndpoint = process.env.NODE_ENV === 'production' && endpoint.startsWith('/api')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
    
  try {
    const response = await fetch(apiEndpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error ${response.status}`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default {
  fetchApi
}; 