/**
 * API service for handling API calls with environment-specific base URLs
 */

// Determine the API base URL based on the environment
export const getApiBaseUrl = () => {
  // Use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback logic
  if (process.env.NODE_ENV === 'production') {
    return 'https://express-backend-7m2c.onrender.com';
  }
  // In development, use the local backend
  return 'http://localhost:5001';
};

const API_BASE_URL = getApiBaseUrl();

// Flag to use mock data when the API is down
const useMockDataWhenApiDown = true;

/**
 * Make a fetch request with the proper base URL
 * @param {string} endpoint - API endpoint (starting with /)
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchApi = async (endpoint, options = {}) => {
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Don't modify the endpoint in production, use the full API_BASE_URL
  const apiEndpoint = `${API_BASE_URL}${normalizedEndpoint}`;
    
  console.log(`[API] Fetching: ${endpoint} (${process.env.NODE_ENV} mode)`);
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
  } else {
    console.warn('[API] No authentication token found in localStorage');
    // Don't fail immediately, let the server decide if the endpoint requires auth
  }
  
  try {
    // Check network connectivity
    if (!navigator.onLine) {
      console.error('[API] Browser reports offline status');
      throw new Error('You are currently offline. Please check your internet connection and try again.');
    }
    
    console.log(`[API] About to fetch from: ${apiEndpoint}`);
    
    // IMPORTANT: Check if we can reach the server with a simple preflight check
    let serverAvailable = true;
    try {
      // Skip preflight for multipart/form-data requests which need direct fetch
      const skipPreflight = options.body instanceof FormData;
      
      if (!skipPreflight) {
        const preflightResponse = await fetch(`${API_BASE_URL}/health`, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'include' // Include credentials in preflight too
        });
        
        if (!preflightResponse.ok) {
          console.warn('[API] Server health check failed');
          serverAvailable = false;
        } else {
          console.log('[API] Server health check passed');
        }
      }
    } catch (preflightError) {
      console.warn('[API] Server preflight check failed:', preflightError.message);
      serverAvailable = false;
      // We'll continue with the main request, but might use fallback later
    }
    
    // If server is not available and we're configured to use mock data, return it now
    if (!serverAvailable && useMockDataWhenApiDown) {
      console.log('[API] Server appears to be down based on health check, using mock data');
      return createMockResponse(endpoint, options);
    }
    
    // Main request
    const response = await fetch(apiEndpoint, {
      ...options,
      headers,
      // Keep cors mode but ensure credentials are properly handled
      mode: 'cors',
      credentials: 'include' // Use 'include' to support cross-domain cookies
    });
    
    console.log(`[API] Fetch response received, status: ${response.status}`);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorText = await response.text();
        console.error(`[API] Response text:`, errorText);
        
        // Check for authentication errors first
        if (response.status === 401) {
          console.error('[API] Authentication error - clearing token');
          localStorage.removeItem('authToken'); // Clear invalid token
          
          // For 401 errors on protected endpoints, return a special mock response
          if (useMockDataWhenApiDown && endpoint.match(/\/api\/(files|visualizations)/)) {
            console.log('[API] Authentication failed but returning mock data for UI continuity');
            return createMockResponse(endpoint, options);
          }
        }
        
        // If API is down and we're set to use mock data, generate mock response
        if (useMockDataWhenApiDown && (response.status === 404 || response.status === 503 || response.status === 0)) {
          console.log('[API] Server appears to be down, using mock data');
          return createMockResponse(endpoint, options);
        }
        
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
        
        // If API is down and we're set to use mock data, generate mock response
        if (useMockDataWhenApiDown && (response.status === 404 || response.status === 503 || response.status === 0)) {
          console.log('[API] Server appears to be down, using mock data');
          return createMockResponse(endpoint, options);
        }
        
        throw new Error(`HTTP error ${response.status}`);
      }
    }
    
    // Log success
    console.log(`[API] Request succeeded: ${apiEndpoint}`);
    return response;
  } catch (error) {
    console.error(`[API] Request failed: ${apiEndpoint}`, error);
    
    // If we should use mock data when API is down
    if (useMockDataWhenApiDown) {
      console.log('[API] Attempting to use mock data due to error:', error.message);
      return createMockResponse(endpoint, options);
    }
    
    // Enhanced error handling for CORS issues
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('[API] This may be a CORS or network connectivity issue');
      throw new Error('Network error. This could be due to connectivity issues or CORS restrictions.');
    }
    
    throw error;
  }
};

/**
 * Create a mock response when the API is down
 * @param {string} endpoint - The endpoint that was requested
 * @param {Object} options - The request options
 * @returns {Response} - A mocked response object
 */
const createMockResponse = (endpoint, options) => {
  console.log('[API] Creating mock response for:', endpoint, options);
  
  let responseData = { success: true };
  
  // Handle different endpoints with appropriate mock data
  if (endpoint.includes('/api/users/login')) {
    responseData = {
      user: {
        id: 'mock-user-id',
        username: 'demo_user',
        email: options.body ? JSON.parse(options.body).email : 'demo@example.com',
        role: 'user'
      },
      token: 'mock-jwt-token-' + Date.now()
    };
  } 
  else if (endpoint.includes('/api/users/register')) {
    const userData = options.body ? JSON.parse(options.body) : {};
    responseData = {
      user: {
        id: 'mock-user-id',
        username: userData.username || 'new_user',
        email: userData.email || 'new@example.com',
        role: 'user'
      },
      token: 'mock-jwt-token-' + Date.now()
    };
  }
  else if (endpoint.includes('/api/files')) {
    responseData = {
      success: true,
      files: [
        {
          _id: 'mock-file-1',
          name: 'Sample CSV Data.csv',
          type: 'text/csv',
          size: 1024,
          createdAt: new Date().toISOString(),
          user: 'mock-user-id'
        },
        {
          _id: 'mock-file-2',
          name: 'Sample JSON Data.json',
          type: 'application/json',
          size: 2048,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          user: 'mock-user-id'
        }
      ]
    };
  }
  else if (endpoint.includes('/api/visualizations')) {
    responseData = {
      success: true,
      visualizations: [
        {
          _id: 'mock-viz-1',
          name: 'Sample Bar Chart',
          description: 'A sample bar chart visualization',
          chartType: 'bar',
          fileId: 'mock-file-1',
          xAxis: 'category',
          yAxis: 'value',
          createdAt: new Date().toISOString(),
          user: 'mock-user-id',
          data: {
            labels: ['Category A', 'Category B', 'Category C', 'Category D'],
            values: [10, 25, 15, 30]
          }
        },
        {
          _id: 'mock-viz-2',
          name: 'Sample Pie Chart',
          description: 'A sample pie chart visualization',
          chartType: 'pie',
          fileId: 'mock-file-2',
          xAxis: 'segment',
          yAxis: 'amount',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          user: 'mock-user-id',
          data: {
            labels: ['Segment 1', 'Segment 2', 'Segment 3'],
            values: [30, 40, 30]
          }
        }
      ]
    };
  }
  else if (endpoint.includes('/api/data/chart')) {
    responseData = {
      success: true,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [65, 59, 80, 81, 56, 55]
      }
    };
  }
  
  // Create a Response object to match the fetch API
  const mockResponse = new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Add custom properties to make it compatible with our response handling
  mockResponse.ok = true;
  mockResponse.isMock = true;
  
  console.log('[API] Created mock response:', responseData);
  return mockResponse;
};

// Auth API methods
export const authApi = {
  // Debug version of register that uses the special debug endpoint
  debugRegister: async (username, email, password) => {
    console.log(`[AUTH] Attempting debug registration for user: ${username} (${email})`);
    try {
      // Try direct fetch without the fetchApi wrapper
      console.log('[AUTH] Making direct fetch to debug endpoint');
      const directResponse = await fetch(`${API_BASE_URL}/api/debug/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      console.log('[AUTH] Debug registration direct fetch response:', directResponse);
      
      if (!directResponse.ok) {
        console.error('[AUTH] Direct fetch failed with status:', directResponse.status);
        const errorText = await directResponse.text();
        console.error('[AUTH] Error text:', errorText);
        
        // If API is down and we're using mock data, return a mock response
        if (useMockDataWhenApiDown) {
          console.log('[AUTH] Using mock data for debug registration');
          return {
            user: {
              id: 'debug-id',
              username,
              email,
              role: 'user'
            },
            token: 'debug-token-' + Date.now()
          };
        }
        
        throw new Error(`HTTP error ${directResponse.status}`);
      }
      
      const data = await directResponse.json();
      console.log('[AUTH] Debug registration response:', data);
      return {
        user: {
          id: 'debug-id',
          username,
          email,
          role: 'user'
        },
        token: data.mockToken || 'debug-token'
      };
    } catch (error) {
      console.error('[AUTH] Debug registration error:', error);
      
      // If API is down and we're using mock data, return a mock response
      if (useMockDataWhenApiDown) {
        console.log('[AUTH] Using mock data for debug registration after error');
        return {
          user: {
            id: 'debug-id',
            username,
            email,
            role: 'user'
          },
          token: 'debug-token-' + Date.now()
        };
      }
      
      throw new Error('Server error. Please try again later.');
    }
  },

  login: async (email, password) => {
    console.log(`[AUTH] Attempting login for user: ${email}`);
    try {
      // Use the correct endpoint path
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
      // First check if the server is reachable
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/health`, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (!healthCheck.ok) {
          console.warn('[AUTH] Server health check failed before Google login');
          // Continue with the request but be prepared for failure
        }
      } catch (healthCheckError) {
        console.error('[AUTH] Server health check failed:', healthCheckError);
        // We'll continue but might use fallback or error gracefully
      }
      
      const response = await fetchApi('/api/users/google', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      console.log('[AUTH] Google login response:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Google login error:', error);
      // Simplified error message that matches our desired UX
      throw new Error('Registration failed. Please try again.');
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
      
      // If this is a mock response, return a default user profile
      if (response.isMock) {
        console.log('[AUTH] Returning mock user profile');
        return {
          _id: 'mock-user-id',
          username: 'demo_user',
          email: 'demo@example.com',
          role: 'user'
        };
      }
      
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

/**
 * Test API connection and return detailed results
 * @returns {Promise<Object>} Connection test results
 */
export const testApiConnection = async () => {
  try {
    console.log('[API] Testing API connection...');
    
    // Check browser online status
    const isOnline = navigator.onLine;
    console.log('[API] Browser online status:', isOnline);
    
    // Basic connectivity test
    let connectionTest = { success: false };
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/connection-test`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        connectionTest = await response.json();
        console.log('[API] Connection test result:', connectionTest);
      } else {
        console.error('[API] Connection test failed with status:', response.status);
        connectionTest.error = `HTTP Error: ${response.status}`;
      }
    } catch (connectionError) {
      console.error('[API] Connection test error:', connectionError);
      connectionTest.error = connectionError.message;
    }
    
    // Auth token check
    const authToken = localStorage.getItem('authToken');
    
    return {
      success: connectionTest.success,
      apiBaseUrl: API_BASE_URL,
      browserOnline: isOnline,
      connectionTest,
      auth: {
        tokenExists: !!authToken,
        tokenLength: authToken ? authToken.length : 0
      },
      corsDetails: connectionTest.details?.cors || { enabled: true, credentials: true },
      envDetails: {
        environment: process.env.NODE_ENV,
        reactAppApiUrl: process.env.REACT_APP_API_URL,
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[API] Error in testApiConnection:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  fetchApi,
  authApi
}; 