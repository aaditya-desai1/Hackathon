import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';

function PageHeader({ title, icon, actions }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 3
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <Box sx={{ mr: 2 }}>
            {icon}
          </Box>
        )}
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
      </Box>
      {actions && (
        <Box>
          {actions}
        </Box>
      )}
    </Box>
  );
}

export default PageHeader; 