import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingState({ text = 'Loading...', size = 40, fullPage = false, height }) {
  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
        }}
      >
        <CircularProgress size={size} thickness={4} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {text}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height || 200,
        width: '100%',
      }}
    >
      <CircularProgress size={size} thickness={4} />
      <Typography variant="body2" sx={{ mt: 2 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default LoadingState; 