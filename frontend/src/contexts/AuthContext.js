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

    loadUser();
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
      const data = await authApi.register(username, email, password);
      
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        
        // Trigger visualization clearing on registration
        console.log('Triggering visualization clear on registration');
        const loginEvent = new CustomEvent('user-login');
        window.dispatchEvent(loginEvent);
        
        if (window._clearVisualizationCache) {
          window._clearVisualizationCache();
        }
        
        return true;
      } else {
        console.error('Registration failed: No token received', data);
        throw new Error(data.error || 'Registration failed. No token received from server.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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