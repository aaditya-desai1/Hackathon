import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Description as FileIcon,
  BarChart as ChartIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  InsertDriveFile as FileTypeIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterPlotIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalVisualizations: 0,
    recentFiles: [],
    recentVisualizations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from the API
        // For now, we'll use the testing_data as our sample data
        
        // Simulate fetching dashboard data with testing_data info
        const dashboardData = {
          totalFiles: 8, // We have 8 files in the testing_data folder
          totalVisualizations: 4, // Let's say we've created 4 visualizations
          recentFiles: [
            { id: 1, name: 'student_scores.csv', type: 'csv', date: new Date().toLocaleDateString() },
            { id: 2, name: 'height_weight.json', type: 'json', date: new Date().toLocaleDateString() },
            { id: 3, name: 'car_performance.csv', type: 'csv', date: new Date().toLocaleDateString() },
            { id: 4, name: 'housing_prices.json', type: 'json', date: new Date().toLocaleDateString() },
          ],
          recentVisualizations: [
            { id: 1, name: 'Student Performance Analysis', type: 'bar', date: new Date().toLocaleDateString() },
            { id: 2, name: 'Height vs Weight Correlation', type: 'scatter', date: new Date().toLocaleDateString() },
            { id: 3, name: 'Sales by Marketing Spend', type: 'line', date: new Date().toLocaleDateString() },
            { id: 4, name: 'Market Share Distribution', type: 'pie', date: new Date().toLocaleDateString() },
          ]
        };
        
        setStats(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUploadClick = () => {
    navigate('/files', { state: { openUploadDialog: true } });
  };

  const handleVisualizationClick = () => {
    navigate('/visualizations', { state: { openCreateDialog: true } });
  };

  const handleRefresh = () => {
    // Refresh stats
    setLoading(true);
    // In a real app you would re-fetch data from the server
    setTimeout(() => setLoading(false), 800); // Simulate loading
  };

  const getChartIcon = (type) => {
    switch (type) {
      case 'bar':
        return <ChartIcon color="primary" />;
      case 'scatter':
        return <ScatterPlotIcon sx={{ color: '#9c27b0' }} />;
      case 'line':
        return <LineChartIcon sx={{ color: '#2e7d32' }} />;
      case 'pie':
        return <PieChartIcon sx={{ color: '#ed6c02' }} />;
      default:
        return <ChartIcon color="primary" />;
    }
  };

  const getFileIcon = (type) => {
    return <FileTypeIcon color={type === 'csv' ? 'primary' : 'secondary'} />;
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (date.toString() === 'Invalid Date') return 'Unknown date';
    
    try {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Dashboard" 
        icon={<ChartIcon />}
        actions={
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Total Files"
              avatar={<FileIcon />}
            />
            <CardContent>
              <Typography variant="h4" component="div">
                {loading ? '...' : stats.totalFiles}
              </Typography>
              <Typography color="text.secondary">
                {stats.totalFiles === 0 ? 'No files uploaded yet' : `${stats.totalFiles} files available`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Visualizations"
              avatar={<ChartIcon />}
            />
            <CardContent>
              <Typography variant="h4" component="div">
                {loading ? '...' : stats.totalVisualizations}
              </Typography>
              <Typography color="text.secondary">
                {stats.totalVisualizations === 0 ? 'No visualizations created yet' : `${stats.totalVisualizations} visualizations created`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Recent Activity"
              avatar={<AddIcon />}
            />
            <CardContent>
              <Typography variant="h4" component="div">
                {loading ? '...' : (stats.recentFiles.length + stats.recentVisualizations.length)}
              </Typography>
              <Typography color="text.secondary">
                {loading ? 'Loading activity...' : 
                  (stats.recentFiles.length + stats.recentVisualizations.length === 0 ? 
                    'No recent activity' : 'Recent file and visualization activity')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Files */}
        {stats.recentFiles.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Files"
                avatar={<FileIcon />}
              />
              <List>
                {stats.recentFiles.map((file, index) => (
                  <React.Fragment key={file.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getFileIcon(file.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`Added ${formatDate(file.date)}`} 
                      />
                    </ListItem>
                    {index < stats.recentFiles.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        {/* Recent Visualizations */}
        {stats.recentVisualizations.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Visualizations"
                avatar={<ChartIcon />}
              />
              <List>
                {stats.recentVisualizations.map((viz, index) => (
                  <React.Fragment key={viz.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getChartIcon(viz.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={viz.name} 
                        secondary={`Created ${formatDate(viz.date)}`} 
                      />
                    </ListItem>
                    {index < stats.recentVisualizations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={handleUploadClick}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <FileIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Upload File</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload CSV, JSON, or text files
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={handleVisualizationClick}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ChartIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Create Visualization</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create charts and graphs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 