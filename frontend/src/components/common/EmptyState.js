import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

function EmptyState({ 
  icon, 
  title = 'No data found', 
  description = 'There are no items to display right now.', 
  action,
  actionText = 'Get Started',
  sx = {}
}) {
  return (
    <Paper
      elevation={0}
      sx={{ 
        p: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        borderRadius: 2,
        backgroundColor: 'background.default',
        border: '1px dashed rgba(0, 0, 0, 0.1)',
        ...sx
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', '& svg': { fontSize: 60 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" component="h3" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450 }}>
        {description}
      </Typography>
      {action && (
        <Button variant="contained" color="primary" onClick={action}>
          {actionText}
        </Button>
      )}
    </Paper>
  );
}

export default EmptyState; 