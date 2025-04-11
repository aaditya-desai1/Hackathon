import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

// Create auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
        setError(null);
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    // Add a global listener for auth-error events
    const handleAuthError = (event) => {
      console.log('Auth error event received:', event.detail);
      setError(event.detail.message || 'Authentication error. Please login again.');
      localStorage.removeItem('authToken');
      setCurrentUser(null);
    };
    
    window.addEventListener('auth-error', handleAuthError);
    loadUser();
    
    // Clean up event listener
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.login(email, password);
      
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        
        // Trigger visualization clearing on login
        console.log('Triggering visualization clear on login');
        const loginEvent = new CustomEvent('user-login');
        window.dispatchEvent(loginEvent);
        
        if (window._clearVisualizationCache) {
          window._clearVisualizationCache();
        }
        
        return true;
      } else {
        console.error('Login failed: No token received', data);
        throw new Error(data.error || 'Login failed. No token received from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const googleLogin = async (credential) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authApi.googleLogin(credential);
      
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        
        // Trigger visualization clearing on Google login
        console.log('Triggering visualization clear on Google login');
        const loginEvent = new CustomEvent('user-login');
        window.dispatchEvent(loginEvent);
        
        if (window._clearVisualizationCache) {
          window._clearVisualizationCache();
        }
        
        return true;
      } else {
        console.error('Google login failed: No token received', data);
        throw new Error(data.error || 'Google login failed. No token received from server.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting registration for user:', { username, email });
      
      // First try regular registration without the debug mode
      try {
        const data = await authApi.register(username, email, password);
        
        console.log('Registration response received:', data);
        
        if (data && data.token) {
          localStorage.setItem('authToken', data.token);
          setCurrentUser(data.user);
          
          // Trigger visualization clearing on registration
          console.log('Registration successful, setting up user session');
          const loginEvent = new CustomEvent('user-login');
          window.dispatchEvent(loginEvent);
          
          if (window._clearVisualizationCache) {
            window._clearVisualizationCache();
          }
          
          return true;
        } else {
          console.error('Registration returned no token:', data);
          throw new Error('Registration failed. No token received from server.');
        }
      } catch (mainErr) {
        console.error('Main registration failed, trying debug mode:', mainErr);
        
        // If main registration fails, try debug mode as fallback
        try {
          console.log('Falling back to debug registration mode');
          const debugData = await authApi.debugRegister(username, email, password);
          
          if (debugData && debugData.token) {
            localStorage.setItem('authToken', debugData.token);
            setCurrentUser(debugData.user);
            
            console.log('Debug registration successful');
            const loginEvent = new CustomEvent('user-login');
            window.dispatchEvent(loginEvent);
            
            if (window._clearVisualizationCache) {
              window._clearVisualizationCache();
            }
            
            return true;
          }
        } catch (debugErr) {
          console.error('Debug registration also failed:', debugErr);
          // Re-throw the original error from the main registration attempt
          throw mainErr;
        }
        
        // If we reach here, both attempts failed
        throw mainErr;
      }
    } catch (err) {
      console.error('All registration attempts failed:', err);
      let errorMessage = 'Registration failed. Please try again.';
      
      // Try to extract a more specific error message
      if (err.message && err.message.includes('already exists')) {
        errorMessage = 'This email or username already exists. Please try a different one.';
      } else if (err.message && err.message.includes('HTTP error 400')) {
        errorMessage = 'Invalid registration data. Please check your information.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user and clear data
  const logout = () => {
    console.log('User logging out, clearing auth token and data');
    
    // Remove auth token
    localStorage.removeItem('authToken');
    
    // Clear user data
    setCurrentUser(null);
    
    // Clear any cached visualizations or files
    // This will force all protected components to fetch fresh data on next login
    if (window._clearFileCache) {
      window._clearFileCache();
    }
    
    if (window._clearVisualizationCache) {
      window._clearVisualizationCache();
    }
    
    // Broadcast a logout event to clear all data
    const logoutEvent = new CustomEvent('user-logout');
    window.dispatchEvent(logoutEvent);
    
    // Optional: You could also implement an API call to logout on the server side
    // But for client-side auth with JWT, removing the token is sufficient
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    googleLogin,
    register,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 