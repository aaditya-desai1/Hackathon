import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Typography, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  
  // Check if the Google OAuth API is properly loaded
  useEffect(() => {
    // Debug - log client ID to console
    console.log('Google Button Component Mounted');
    console.log('Client ID from env:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
  }, []);
  
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login success:', credentialResponse);
    try {
      const success = await googleLogin(credentialResponse.credential);
      
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during Google login processing:', error);
      alert('There was an error processing your Google login. Please try again.');
    }
  };
  
  const handleGoogleError = (error) => {
    console.error('Google login failed:', error);
    alert('Google login failed. Please try again or use email registration.');
  };
  
  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="signup_with"
          shape="rectangular"
          logo_alignment="center"
          width="280"
          useOneTap={false}
        />
      </Box>
    </Box>
  );
};

export default GoogleLoginButton; 