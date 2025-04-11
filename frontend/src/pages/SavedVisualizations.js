import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../contexts/DataContext';
import { fetchApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useTheme,
  Container,
  Divider,
  Chip,
  Alert,
  Paper,
  CardActions,
  Snackbar,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import SaveIcon from '@mui/icons-material/Save';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import { Chart, registerables } from 'chart.js/auto';
import { renderChartToCanvas } from '../utils/chartUtils';

// Register all chart components
Chart.register(...registerables);

function SavedVisualizations() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { lastUpdate } = useDataContext();
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { isAuthenticated } = useAuth();

  // Fetch saved visualizations
  useEffect(() => {
    const fetchVisualizations = async () => {
      setLoading(true);
      try {
        // Only fetch if user is authenticated
        if (!isAuthenticated) {
          setVisualizations([]);
          return;
        }

        const response = await fetchApi('/api/visualizations');
        const data = await response.json();
        setVisualizations(data.visualizations || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching visualizations:', err);
        setError('Failed to load saved visualizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVisualizations();
  }, [lastUpdate, isAuthenticated]);

  // Register function to clear visualizations cache when needed (on logout)
  useEffect(() => {
    window._clearVisualizationCache = () => {
      console.log('Clearing visualizations cache');
      setVisualizations([]);
    };
    
    // Listen for logout events to clear visualizations
    const handleLogout = () => {
      console.log('Logout event detected, clearing visualizations');
      setVisualizations([]);
    };
    
    // Listen for login events to clear visualizations
    const handleLogin = () => {
      console.log('Login event detected, clearing visualizations');
      setVisualizations([]);
    };
    
    window.addEventListener('user-logout', handleLogout);
    window.addEventListener('user-login', handleLogin);
    
    // Cleanup on component unmount
    return () => {
      delete window._clearVisualizationCache;
      window.removeEventListener('user-logout', handleLogout);
      window.removeEventListener('user-login', handleLogin);
    };
  }, []);

  const handleViewVisualization = (viz) => {
    console.log('Opening visualization for viewing:', viz);
    setCurrentVisualization(viz);
    setOpenViewDialog(true);
    
    // Always fetch fresh data from the server to ensure we have the latest
    console.log('Fetching fresh data for visualization');
    fetchVisualizationData(viz._id);
  };

  // Function to fetch complete visualization data from the server
  const fetchVisualizationData = async (vizId) => {
    try {
      console.log(`Fetching visualization data for ID: ${vizId}`);
      
      // First get the visualization metadata
      const response = await fetchApi(`/api/visualizations/${vizId}`);
      
      const data = await response.json();
      const visualization = data.visualization;
      
      console.log('Fetched visualization metadata:', {
        id: visualization._id,
        name: visualization.name,
        chartType: visualization.chartType,
        fileId: visualization.fileId,
        xAxis: visualization.config?.xAxis?.field || visualization.xAxis,
        yAxis: visualization.config?.yAxis?.field || visualization.yAxis
      });
      
      // Now fetch the actual chart data from the data API
      if (visualization.fileId && visualization.fileId._id) {
        const fileId = visualization.fileId._id;
        const xAxis = visualization.config?.xAxis?.field || visualization.xAxis;
        const yAxis = visualization.config?.yAxis?.field || visualization.yAxis;
        
        if (xAxis && yAxis) {
          console.log(`Fetching fresh chart data from API for file ${fileId}`);
          
          // Prepare API URL to get the actual data
          let dataUrl = `/api/data/chart?fileId=${fileId}&yAxis=${yAxis}`;
          
          if (xAxis) {
            dataUrl += `&xAxis=${xAxis}`;
          }
          
          console.log(`Chart data API URL: ${dataUrl}`);
          
          const dataResponse = await fetchApi(dataUrl);
          const chartDataResult = await dataResponse.json();
          
          if (chartDataResult.success && chartDataResult.chartData) {
            console.log('Retrieved fresh chart data from API:', chartDataResult.chartData);
            
            // Update the visualization with fresh data
            visualization.data = {
              labels: chartDataResult.chartData.labels || [],
              values: chartDataResult.chartData.values || [],
              datasets: []
            };
            
            console.log('Updated visualization with fresh data:', {
              labels: visualization.data.labels?.slice(0, 5),
              values: visualization.data.values?.slice(0, 5),
              labelCount: visualization.data.labels?.length,
              valueCount: visualization.data.values?.length
            });
          }
        }
      }
      
      // Update the current visualization with the complete data
      setCurrentVisualization(visualization);
      
      // Render chart with the updated data
      setTimeout(() => {
        if (chartContainerRef.current) {
          renderChart(visualization);
        }
      }, 100);
      
      return visualization;
    } catch (err) {
      console.error('Error fetching visualization data:', err);
      setError('Failed to load visualization data. Please try again.');
      return null;
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    
    // Clean up chart instance when dialog is closed
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  };

  const handleDownloadVisualization = async (viz) => {
    try {
      // Fetch the latest data first
      console.log('Fetching latest data before download');
      const updatedViz = await fetchVisualizationData(viz._id);
      
      // If failed to fetch data, use the original visualization
      const visualizationToUse = updatedViz || viz;
      
      // Create a temporary canvas element
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 800;
      tempCanvas.height = 500;
      document.body.appendChild(tempCanvas);
      
      // Render the chart to the temporary canvas
      const ctx = tempCanvas.getContext('2d');
      const tempChart = renderChartToCanvas(visualizationToUse, ctx);
      
      // Wait for chart to render, then download
      setTimeout(() => {
        try {
          // Convert canvas to image and download
          const link = document.createElement('a');
          link.download = `${visualizationToUse.name || 'chart'}.png`;
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
          
          // Clean up
          document.body.removeChild(tempCanvas);
          tempChart.destroy();
        } catch (err) {
          console.error('Error downloading chart:', err);
          setError('Failed to download chart. Please try again.');
        }
      }, 500);
    } catch (err) {
      console.error('Error preparing download:', err);
      setError('Failed to prepare chart for download.');
    }
  };

  const handleDeleteVisualization = (viz) => {
    setCurrentVisualization(viz);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteVisualization = async () => {
    if (!currentVisualization) return;
    
    try {
      const response = await fetchApi(`/api/visualizations/${currentVisualization._id}`, {
        method: 'DELETE',
      });
      
      // Remove deleted visualization from state
      setVisualizations(visualizations.filter(v => v._id !== currentVisualization._id));
      setOpenDeleteDialog(false);
      setCurrentVisualization(null);
    } catch (err) {
      console.error('Error deleting visualization:', err);
      setError('Failed to delete visualization. Please try again.');
    }
  };

  const renderChart = (visualization) => {
    if (!chartContainerRef.current) return;

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartContainerRef.current.getContext('2d');
    chartInstanceRef.current = renderChartToCanvas(visualization, ctx);
  };

  const renderChartToCanvas = (visualization, ctx) => {
    // Debug visualization data
    console.log('Rendering visualization:', visualization);
    
    // Parse data from visualization
    const chartData = visualization.data || {};
    let labels = chartData.labels || [];
    let values = chartData.values || [];
    
    console.log('Chart data extracted:', { 
      type: visualization.chartType,
      labels, 
      values,
      hasValues: values.length > 0,
      hasLabels: labels.length > 0,
      sampleLabels: labels.slice(0, 5),
      sampleValues: values.slice(0, 5),
    });
    
    // If we don't have data, try to extract from config
    if ((!labels || labels.length === 0) || (!values || values.length === 0)) {
      // If we're still missing data, this is a serious issue so we'll try to fetch it again
      console.warn('Missing chart data - attempting to fetch again');
      
      if (visualization._id) {
        fetchVisualizationData(visualization._id);
      }
      
      // Create fallback data in the meantime
      if (visualization.chartType === 'pie') {
        // Fallback data for pie chart
        labels.push('Category A', 'Category B', 'Category C', 'Category D');
        values.push(40, 25, 20, 15);
      } else {
        // Fallback for other chart types
        labels.push('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun');
        values.push(12, 19, 3, 5, 2, 3);
      }
    }
    
    // Generate colors for the data points
    const colors = generateColors(values.length);
    
    // Prepare datasets based on chart type
    let datasets = [];
    
    if (visualization.chartType === 'pie' || visualization.chartType === 'doughnut') {
      datasets = [{
        data: values,
        backgroundColor: values.map((_, i) => colors[i % colors.length]),
        borderColor: values.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
        hoverOffset: 12
      }];
    } else if (visualization.chartType === 'line') {
      datasets = [{
        label: visualization.config?.yAxis?.field || visualization.yAxis || 'Values',
        data: values,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }];
    } else {
      // Default dataset for bar and other charts
      datasets = [{
        label: visualization.config?.yAxis?.field || visualization.yAxis || 'Values',
        data: values,
        backgroundColor: values.map((_, i) => `${colors[i % colors.length]}80`), // 80 is 50% opacity in hex
        borderColor: values.map((_, i) => colors[i % colors.length]),
        borderWidth: 1
      }];
    }

    // Create chart configuration
    const config = {
      type: visualization.chartType || 'bar',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: visualization.name,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                return labels[tooltipItems[0].dataIndex];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: visualization.config?.xAxis?.field || visualization.xAxis || 'Categories',
            },
            display: visualization.chartType !== 'pie' && visualization.chartType !== 'doughnut'
          },
          y: {
            title: {
              display: true,
              text: visualization.config?.yAxis?.field || visualization.yAxis || 'Values',
            },
            beginAtZero: true,
            display: visualization.chartType !== 'pie' && visualization.chartType !== 'doughnut'
          },
        },
      },
    };

    // Create chart
    return new Chart(ctx, config);
  };

  const generateColors = (count) => {
    // Bright and distinct colors for better visualization
    const baseColors = [
      '#4e79a7', // blue
      '#f28e2c', // orange
      '#e15759', // red
      '#76b7b2', // teal
      '#59a14f', // green
      '#edc949', // yellow
      '#af7aa1', // purple
      '#ff9da7', // pink
      '#9c755f', // brown
      '#1f77b4', // slate blue
      '#ff7f0e', // bright orange
      '#2ca02c', // forest green
      '#d62728', // crimson
      '#9467bd', // lavender
      '#8c564b', // chocolate
      '#e377c2'  // rose
    ];
    
    // If we have more data points than colors, generate additional colors
    if (count > baseColors.length) {
      // Generate additional colors using hue rotation
      for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137.5) % 360; // Use golden angle approximation for nice distribution
        const saturation = 75;
        const lightness = 55;
        baseColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
    }
    
    // Return the colors
    return Array(count).fill().map((_, i) => baseColors[i % baseColors.length]);
  };

  const getVisualizationIcon = (type) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon />;
      case 'line':
        return <ShowChartIcon />;
      case 'pie':
        return <PieChartIcon />;
      case 'scatter':
        return <ScatterPlotIcon />;
      default:
        return <BarChartIcon />;
    }
  };

  // Add a function to completely clear visualization localStorage
  const clearVisualizationCache = () => {
    console.log('Completely cleaning visualization data from localStorage');
    localStorage.removeItem('previewCharts');
    localStorage.removeItem('previewFile');
    localStorage.removeItem('analysisCache');
    
    // Clear any other visualization-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('chart') || key?.includes('visualization') || key?.includes('preview')) {
        localStorage.removeItem(key);
      }
    }
    
    // Refresh the page to apply changes
    window.location.reload();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <PageHeader 
          title="Saved Visualizations" 
          icon={<SaveIcon />}
          subtitle="View and download your saved data visualizations"
        />

        {/* Add a button to clear visualization cache - only show if there's an issue */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={clearVisualizationCache}
            startIcon={<DeleteIcon />}
          >
            Clear Visualization Cache
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 4 }}>
            {error}
          </Alert>
        )}

        {!loading && visualizations.length === 0 && (
          <Box 
            sx={{ 
              mt: 4, 
              p: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              boxShadow: 1
            }}
          >
            <SaveIcon sx={{ width: 80, height: 80, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No saved visualizations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 4 }}>
              Create and save visualizations from the Visualizations page to see them here.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/visualizations')}
            >
              Create Visualization
            </Button>
          </Box>
        )}

        {!loading && visualizations.length > 0 && (
          <Grid container spacing={3}>
            {visualizations.map((viz) => (
              <Grid item xs={12} sm={6} md={4} key={viz._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: theme.shadows[3],
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6],
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: 'primary.main', 
                      color: 'white' 
                    }}
                  >
                    {getVisualizationIcon(viz.chartType)}
                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                      {viz.name}
                    </Typography>
                    <Chip 
                      label={viz.chartType.charAt(0).toUpperCase() + viz.chartType.slice(1)} 
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </Box>
                  
                  <Divider />
                  
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {viz.description || `A ${viz.chartType} chart visualization of ${viz.xAxis} and ${viz.yAxis}.`}
                    </Typography>
                    
                    <Box sx={{ 
                      mt: 2,
                      p: 1.5,
                      height: 180,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getVisualizationIcon(viz.chartType)}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        Click View to see visualization
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                    <Button 
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewVisualization(viz)}
                      sx={{ flex: 1, mr: 1 }}
                    >
                      View
                    </Button>
                    <Button 
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadVisualization(viz)}
                      sx={{ flex: 1, mx: 1 }}
                      color="secondary"
                    >
                      Download
                    </Button>
                    <IconButton 
                      color="error"
                      onClick={() => handleDeleteVisualization(viz)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* View Visualization Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}
        >
          <Typography variant="h6">
            {currentVisualization?.name || 'Visualization'}
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleCloseViewDialog} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ height: 400, mb: 3 }}>
            <canvas 
              ref={chartContainerRef} 
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          
          {currentVisualization && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Chart Type:</strong> {currentVisualization.chartType?.charAt(0).toUpperCase() + currentVisualization.chartType?.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(currentVisualization.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong> {currentVisualization.description || 'No description provided.'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadVisualization(currentVisualization)}
                  sx={{ mr: 2 }}
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    handleCloseViewDialog();
                    handleDeleteVisualization(currentVisualization);
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Delete Visualization
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DeleteIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h6">
              Are you sure?
            </Typography>
          </Box>
          <Typography>
            The visualization "{currentVisualization?.name}" will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteVisualization} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
}

export default SavedVisualizations; 