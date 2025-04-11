import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Typography, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login success:', credentialResponse);
    const success = await googleLogin(credentialResponse.credential);
    
    if (success) {
      navigate('/dashboard');
    }
  };
  
  const handleGoogleError = () => {
    console.error('Google login failed');
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
          text="signin_with"
          shape="rectangular"
          logo_alignment="center"
          width="280"
          useOneTap={true}
          flow="implicit"
          auto_select={false}
          cookiePolicy={'single_host_origin'}
          ux_mode="popup"
        />
      </Box>
    </Box>
  );
};

export default GoogleLoginButton; 