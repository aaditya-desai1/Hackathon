/**
 * API service for handling API calls with environment-specific base URLs
 */

// Determine the API base URL based on the environment
const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback logic
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
    
  console.log(`[API] Fetching: ${apiEndpoint} (${process.env.NODE_ENV} mode)`);
  console.log(`[API] Base URL: ${API_BASE_URL}`);
  console.log(`[API] Request options:`, options);
  
  // Add auth token to headers if available
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`[API] Using token: ${token.substring(0, 10)}...`);
  }
  
  try {
    // Check network connectivity
    if (!navigator.onLine) {
      console.error('[API] Browser reports offline status');
      throw new Error('You are currently offline. Please check your internet connection and try again.');
    }
    
    console.log(`[API] About to fetch from: ${apiEndpoint}`);
    const response = await fetch(apiEndpoint, {
      ...options,
      headers,
      credentials: 'include', // Include credentials for CORS requests
      mode: 'cors' // Explicitly set CORS mode
    });
    console.log(`[API] Fetch response received, status: ${response.status}`);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorText = await response.text();
        console.error(`[API] Response text:`, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error(`[API] Request failed with status ${response.status}:`, errorData);
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        } catch (jsonError) {
          console.error(`[API] Could not parse error response as JSON:`, jsonError);
          throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
        }
      } catch (e) {
        console.error(`[API] Request failed with status ${response.status}, could not read response:`, e);
        throw new Error(`HTTP error ${response.status}`);
      }
    }
    
    // Log success
    console.log(`[API] Request succeeded: ${apiEndpoint}`);
    return response;
  } catch (error) {
    console.error(`[API] Request failed: ${apiEndpoint}`, error);
    
    // Enhanced error handling for CORS issues
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('[API] This may be a CORS or network connectivity issue');
      throw new Error('Network error. This could be due to connectivity issues or CORS restrictions.');
    }
    
    throw error;
  }
};

// Auth API methods
export const authApi = {
  login: async (email, password) => {
    console.log(`[AUTH] Attempting login for user: ${email}`);
    try {
      console.log(`[AUTH] Making API request to /api/users/login`);
      const response = await fetchApi('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      console.log(`[AUTH] Login response received, status: ${response.status}`);
      const data = await response.json();
      console.log('[AUTH] Login response data:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      console.error('[AUTH] Login error stack:', error.stack);
      // Extract the error message from the error object
      const errorMessage = error.message.includes('HTTP error') 
        ? 'Server error. Please try again later.'
        : error.message;
      throw new Error(errorMessage);
    }
  },
  
  googleLogin: async (token) => {
    console.log(`[AUTH] Attempting Google login with token`);
    try {
      const response = await fetchApi('/api/users/google', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      console.log('[AUTH] Google login response:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Google login error:', error);
      // Extract the error message from the error object
      const errorMessage = error.message.includes('HTTP error') 
        ? 'Google authentication failed. Please try again later.'
        : error.message;
      throw new Error(errorMessage);
    }
  },
  
  register: async (username, email, password) => {
    console.log(`[AUTH] Attempting registration for user: ${username} (${email})`);
    try {
      const response = await fetchApi('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      console.log('[AUTH] Registration response:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      // Extract the error message from the error object
      const errorMessage = error.message.includes('HTTP error') 
        ? 'Server error. Please try again later.'
        : error.message;
      throw new Error(errorMessage);
    }
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('[AUTH] No token found, user not logged in');
      return null;
    }
    
    try {
      console.log('[AUTH] Fetching current user profile');
      const response = await fetchApi('/api/users/profile');
      const data = await response.json();
      console.log('[AUTH] Current user data:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Failed to get current user:', error);
      localStorage.removeItem('authToken');
      return null;
    }
  }
};

export default {
  fetchApi,
  authApi
}; 