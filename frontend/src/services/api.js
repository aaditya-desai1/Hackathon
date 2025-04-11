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
  return 'http://localhost:5000';
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
    'Accept': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Create options with headers
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    };
    
    // Make the request with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    fetchOptions.signal = controller.signal;
    
    // Make the network request
    const response = await fetch(apiEndpoint, fetchOptions);
    clearTimeout(timeoutId);
    
    // Handle HTTP errors with proper error message extraction
    if (!response.ok) {
      // Try to get a proper error message from the response
      let errorMessage;
      try {
        // Try to parse the response as JSON to get a detailed error message
        const errorData = await response.json();
        
        // Use the error message from the response if available
        errorMessage = errorData.error || 
                      errorData.message || 
                      `HTTP error ${response.status}: ${response.statusText}`;
                      
        console.error('[API] Response error data:', errorData);
      } catch (parseError) {
        // If parsing fails, use a generic error message
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        console.error('[API] Could not parse error response:', parseError);
      }
      
      // Create an error object with detailed information
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      
      throw error;
    }
    
    return response;
  } catch (error) {
    // Special handling for network errors
    if (error.name === 'AbortError') {
      console.error('[API] Request timeout:', apiEndpoint);
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    
    if (error.message && error.message.includes('Network request failed')) {
      console.error('[API] Network request failed:', apiEndpoint);
      
      // Check if server is down and mock mode is available
      if (useMockDataWhenApiDown) {
        console.log('[API] Server appears to be down, checking for mock data');
        // Return a mock response if appropriate
        const mockResponse = createMockResponse(normalizedEndpoint, options);
        if (mockResponse) {
          console.log('[API] Using mock data for:', endpoint);
          return mockResponse;
        }
      }
      
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    // For authentication errors, dispatch an event to notify the app
    if (error.status === 401) {
      console.error('[API] Authentication error:', error.message);
      const authErrorEvent = new CustomEvent('auth-error', { 
        detail: { 
          message: error.message,
          status: error.status
        } 
      });
      window.dispatchEvent(authErrorEvent);
    }
    
    console.error(`[API] Fetch error for ${apiEndpoint}:`, error);
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