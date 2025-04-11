import React from 'react';
import { Container, Typography, Box, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToSignup = () => {
    navigate('/signup');
  };

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to DataViz Pro
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Powerful data visualization tool to transform your data into meaningful insights
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Get Started Today
          </Typography>
          <Typography variant="body1" paragraph>
            Create an account or sign in to access the full features of DataViz Pro.
          </Typography>
        </Box>
        
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={goToSignup}
            >
              Sign Up
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={goToLogin}
            >
              Sign In
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Data Visualization
            </Typography>
            <Typography variant="body1">
              Create beautiful and interactive charts from your data with just a few clicks.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Data Management
            </Typography>
            <Typography variant="body1">
              Upload, organize, and manage your datasets with ease and convenience.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Insights & Analytics
            </Typography>
            <Typography variant="body1">
              Extract valuable insights from your data through advanced analytics tools.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default LandingPage; 