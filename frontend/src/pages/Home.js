import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Card, CardContent, CardHeader, List, ListItem, 
  ListItemText, ListItemIcon, Divider, useTheme
} from '@mui/material';
import { Chart } from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import StorageIcon from '@mui/icons-material/Storage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalVisualizations: 0,
    recentFiles: [],
    recentVisualizations: []
  });
  const navigate = useNavigate();
  const activityChartRef = useRef(null);
  const storageChartRef = useRef(null);
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Simulate fetching dashboard data
    const dashboardData = {
      totalFiles: 12,
      totalVisualizations: 8,
      recentFiles: [
        { id: 1, name: 'sales_data_2023.csv', type: 'csv', size: '2.4 MB', date: '2023-05-15' },
        { id: 2, name: 'customer_feedback.json', type: 'json', size: '1.8 MB', date: '2023-05-10' },
        { id: 3, name: 'marketing_campaigns.xlsx', type: 'excel', size: '3.2 MB', date: '2023-05-05' }
      ],
      recentVisualizations: [
        { id: 1, name: 'Monthly Sales Trend', type: 'line', date: '2023-05-16' },
        { id: 2, name: 'Customer Satisfaction by Region', type: 'bar', date: '2023-05-12' },
        { id: 3, name: 'Marketing ROI Analysis', type: 'pie', date: '2023-05-07' }
      ]
    };
    
    setStats(dashboardData);
    
    // Initialize charts
    initCharts();
    
    // Cleanup charts on unmount
    return () => {
      if (activityChartRef.current) {
        activityChartRef.current.destroy();
      }
      if (storageChartRef.current) {
        storageChartRef.current.destroy();
      }
    };
  }, [theme.palette.mode]); // Re-initialize charts when theme changes
  
  const initCharts = () => {
    // Activity Chart
    if (activityChartRef.current) {
      activityChartRef.current.destroy();
    }
    
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
      activityChartRef.current = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Files Uploaded',
            data: [3, 5, 2, 7, 4, 6],
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.main,
            tension: 0.4,
            pointBackgroundColor: theme.palette.primary.main,
            pointBorderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'white',
            pointBorderWidth: 2,
          }, {
            label: 'Visualizations Created',
            data: [2, 3, 1, 4, 2, 3],
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.secondary.main,
            tension: 0.4,
            pointBackgroundColor: theme.palette.secondary.main,
            pointBorderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'white',
            pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: theme.palette.text.primary
              }
            },
            tooltip: {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              titleColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
              bodyColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              borderWidth: 1,
              padding: 10,
              boxPadding: 3,
            }
          },
          scales: {
            x: {
              grid: {
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              },
              ticks: {
                color: theme.palette.text.secondary
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              },
              ticks: {
                color: theme.palette.text.secondary
              }
            }
          }
        }
      });
    }
    
    // Storage Usage Chart
    if (storageChartRef.current) {
      storageChartRef.current.destroy();
    }
    
    const storageCtx = document.getElementById('storageChart');
    if (storageCtx) {
      storageChartRef.current = new Chart(storageCtx, {
        type: 'doughnut',
        data: {
          labels: ['CSV', 'JSON', 'Excel', 'Other'],
          datasets: [{
            data: [40, 25, 20, 15],
            backgroundColor: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              theme.palette.success.main,
              theme.palette.warning.main
            ],
            borderColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'white',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme.palette.text.primary,
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              titleColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
              bodyColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              borderWidth: 1
            }
          },
          cutout: '70%'
        }
      });
    }
  };
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToSignup = () => {
    navigate('/signup');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!isAuthenticated ? (
        <>
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h2" component="h1" gutterBottom>
              Welcome to DataViz Pro
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Powerful data visualization tool to transform your data into meaningful insights
            </Typography>
          </Box>

          <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
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
        </>
      ) : (
        <>
          <Typography variant="h4" gutterBottom component="h1">
            Dashboard
          </Typography>
          
          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'background.paper',
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                elevation={2}
              >
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Total Files
                </Typography>
                <Typography component="p" variant="h3">
                  {stats.totalFiles}
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    right: -10,
                    bottom: -15,
                    opacity: 0.2,
                    transform: 'rotate(-15deg)'
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 100, color: 'primary.main' }} />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'background.paper',
                  borderLeft: 4,
                  borderColor: 'secondary.main',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                elevation={2}
              >
                <Typography component="h2" variant="h6" color="secondary" gutterBottom>
                  Visualizations
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
              borderLeft: 4,
              borderColor: 'primary.main',
              position: 'relative',
              overflow: 'hidden'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Files
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalFiles}
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                bottom: -15,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
              }}
            >
              <DescriptionIcon sx={{ fontSize: 100, color: 'primary.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
              borderLeft: 4,
              borderColor: 'secondary.main',
              position: 'relative',
              overflow: 'hidden'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="secondary" gutterBottom>
              Visualizations
            </Typography>
            <Typography component="p" variant="h3">
              {stats.totalVisualizations}
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                bottom: -15,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
              }}
            >
              <BarChartIcon sx={{ fontSize: 100, color: 'secondary.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
              borderLeft: 4,
              borderColor: 'success.main',
              position: 'relative',
              overflow: 'hidden'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="success.main" gutterBottom>
              Storage Used
            </Typography>
            <Typography component="p" variant="h3">
              7.4 MB
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                bottom: -15,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
              }}
            >
              <StorageIcon sx={{ fontSize: 100, color: 'success.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: 'background.paper',
              borderLeft: 4,
              borderColor: 'warning.main',
              position: 'relative',
              overflow: 'hidden'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="warning.main" gutterBottom>
              Analysis Score
            </Typography>
            <Typography component="p" variant="h3">
              85%
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                bottom: -15,
                opacity: 0.2,
                transform: 'rotate(-15deg)'
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 100, color: 'warning.main' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              bgcolor: 'background.paper'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Activity Overview
            </Typography>
            <Box sx={{ height: '100%', position: 'relative' }}>
              <canvas id="activityChart"></canvas>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
              bgcolor: 'background.paper'
            }}
            elevation={2}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Storage by File Type
            </Typography>
            <Box sx={{ height: '100%', position: 'relative' }}>
              <canvas id="storageChart"></canvas>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardHeader 
              title="Recent Files" 
              action={
                <Button color="primary" onClick={() => navigate('/files')}>
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%' }}>
                {stats.recentFiles.map((file, index) => (
                  <React.Fragment key={file.id}>
                    <ListItem
                      button
                      alignItems="flex-start"
                      onClick={() => navigate(`/files/${file.id}`)}
                      sx={{
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <DescriptionIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={
                          <React.Fragment>
                            <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {file.type.toUpperCase()} • {file.size}
                            </Typography>
                            {` — Uploaded on ${new Date(file.date).toLocaleDateString()}`}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < stats.recentFiles.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardHeader 
              title="Recent Visualizations" 
              action={
                <Button color="primary" onClick={() => navigate('/visualizations')}>
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ width: '100%' }}>
                {stats.recentVisualizations.map((viz, index) => (
                  <React.Fragment key={viz.id}>
                    <ListItem
                      button
                      alignItems="flex-start"
                      onClick={() => navigate(`/visualizations/${viz.id}`)}
                      sx={{
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {viz.type === 'bar' && <BarChartIcon color="secondary" />}
                        {viz.type === 'line' && <TimelineIcon color="secondary" />}
                        {viz.type === 'pie' && <CheckCircleOutlineIcon color="secondary" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={viz.name}
                        secondary={
                          <React.Fragment>
                            <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} chart
                            </Typography>
                            {` — Created on ${new Date(viz.date).toLocaleDateString()}`}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < stats.recentVisualizations.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!isAuthenticated ? (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mt: 6 }}>
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
      ) : (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={goToDashboard}
          >
            Go to Dashboard
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Home; 
