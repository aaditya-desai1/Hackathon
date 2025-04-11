import React from 'react';
import { Alert, Typography, Box, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * A standardized error alert component for consistent error display across the app
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - The error message to display
 * @param {string} props.severity - Alert severity (error, warning, info, success)
 * @param {Function} props.onRetry - Optional retry function to be called when retry button is clicked
 * @param {Object} props.sx - Additional styles for the Alert component
 * @param {boolean} props.showRefreshButton - Whether to show a refresh button
 * @param {node} props.action - Optional custom action component to display
 * @returns {JSX.Element} - Error alert component
 */
const ErrorAlert = ({ 
  message, 
  severity = 'error', 
  onRetry, 
  sx = {}, 
  showRefreshButton = false,
  action
}) => {
  // Parse specific error types for better display
  const parseErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'An unknown error occurred';
    
    // Handle special error types
    if (errorMsg.includes('Cannot set property ok of #<Response>')) {
      return 'Server connection issue. Please try again in a moment.';
    }
    
    if (errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (errorMsg.includes('Invalid credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    
    // Return the original message if no special case matched
    return errorMsg;
  };
  
  const parsedMessage = parseErrorMessage(message);
  
  // Get additional details for specific error types
  const getErrorDetails = (errorMsg) => {
    if (!errorMsg) return null;
    
    if (errorMsg.includes('Cannot set property ok of #<Response>')) {
      return 'This may indicate a problem with the server or with your internet connection.';
    }
    
    if (errorMsg.includes('NetworkError') || errorMsg.includes('Failed to fetch')) {
      return 'Please check that you are connected to the internet and try again.';
    }
    
    if (errorMsg.includes('Invalid credentials')) {
      return 'Please double-check your email and password and try again.';
    }
    
    return null;
  };
  
  const errorDetails = getErrorDetails(message);
  
  // Define the default action if showRefreshButton is true and no custom action provided
  const defaultAction = showRefreshButton ? (
    <Button 
      color="inherit" 
      size="small" 
      startIcon={<RefreshIcon />}
      onClick={() => window.location.reload()}
    >
      Refresh
    </Button>
  ) : undefined;
  
  return (
    <Alert 
      severity={severity} 
      sx={{ 
        mb: 2, 
        '& .MuiAlert-message': { 
          width: '100%' 
        }, 
        ...sx 
      }}
      action={action || defaultAction}
    >
      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
        {parsedMessage}
      </Typography>
      
      {errorDetails && (
        <Box component="div" sx={{ mt: 0.5 }}>
          <Typography variant="body2">
            {errorDetails}
          </Typography>
        </Box>
      )}
      
      {onRetry && (
        <Box sx={{ mt: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            color="inherit"
            onClick={onRetry}
          >
            Try Again
          </Button>
        </Box>
      )}
    </Alert>
  );
};

export default ErrorAlert; 