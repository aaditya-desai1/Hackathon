import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
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
  CircularProgress,
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
  Save as SaveIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import { fetchApi } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const { lastUpdate, refreshData } = useDataContext();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalVisualizations: 0,
    recentFiles: [],
    recentVisualizations: [],
    savedVisualizations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      // Fetch files
      let filesData = { files: [] };
      try {
        console.log('Fetching files for dashboard...');
        const filesResponse = await fetchApi('/api/files');
        filesData = await filesResponse.json();
        console.log('Files data fetched:', filesData);
      } catch (filesError) {
        console.error('Files fetch error:', filesError);
        // Continue with empty array rather than failing completely
      }
      
      // Fetch visualizations
      let vizData = { visualizations: [] };
      try {
        console.log('Fetching visualizations for dashboard...');
        const vizResponse = await fetchApi('/api/visualizations');
        vizData = await vizResponse.json();
        console.log('Visualizations data fetched:', vizData);
      } catch (vizError) {
        console.error('Visualizations fetch error:', vizError);
        // Continue with empty array rather than failing completely
      }
      
      // Fetch saved visualizations count
      let savedVizCount = 0;
      try {
        console.log('Fetching saved visualizations count...');
        const savedVizResponse = await fetchApi('/api/visualizations?saved=true');
        const savedVizData = await savedVizResponse.json();
        savedVizCount = savedVizData.count || 0;
        console.log('Number of saved visualizations:', savedVizCount);
      } catch (savedVizError) {
        console.error('Saved visualizations fetch error:', savedVizError);
      }
      
      // Build dashboard data even if one API fails
      const dashboardData = {
        totalFiles: filesData.files ? filesData.files.length : 0,
        totalVisualizations: vizData.visualizations ? vizData.visualizations.length : 0,
        savedVisualizations: savedVizCount,
        recentFiles: filesData.files ? 
          filesData.files
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4)
            .map(file => ({
              id: file._id,
              name: file.name,
              type: file.type === 'text/csv' ? 'csv' : 'json',
              date: file.createdAt
            })) : [],
        recentVisualizations: vizData.visualizations ?
          vizData.visualizations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4)
            .map(viz => ({
              id: viz._id,
              name: viz.name,
              type: viz.chartType || 'bar',
              date: viz.createdAt
            })) : []
      };
      
      console.log('Dashboard data updated:', dashboardData);
      setStats(dashboardData);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      if (retryCount < 2) {
        // Wait and retry
        const retryDelay = 1000 * (retryCount + 1);
        console.log(`Retrying dashboard data fetch in ${retryDelay}ms...`);
        setTimeout(() => fetchData(retryCount + 1), retryDelay);
        return;
      }
      
      setError('Failed to load dashboard data');
      // Set empty data on error
      setStats({
        totalFiles: 0,
        totalVisualizations: 0,
        recentFiles: [],
        recentVisualizations: [],
        savedVisualizations: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data whenever lastUpdate changes (files or visualizations were modified)
    console.log('Dashboard effect triggered by lastUpdate change', new Date().toISOString());
    fetchData();
    setLastRefresh(Date.now());
  }, [lastUpdate]);
  
  useEffect(() => {
    // Set up an interval to refresh data every 15 seconds while the component is mounted
    console.log('Setting up dashboard refresh interval');
    const refreshInterval = setInterval(() => {
      console.log('Dashboard auto-refresh triggered');
      fetchData();
      setLastRefresh(Date.now());
    }, 15000);
    
    // Fetch data immediately when component mounts
    fetchData();
    setLastRefresh(Date.now());
    
    // Detect when the user returns to this tab/window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard visibility changed to visible, refreshing data');
        // Refresh data when user returns to tab
        fetchData();
        setLastRefresh(Date.now());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up on unmount
    return () => {
      console.log('Dashboard component unmounting, cleaning up listeners');
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for logout events to clear dashboard data
  useEffect(() => {
    const handleLogout = () => {
      console.log('Logout event detected, clearing dashboard data');
      setStats({
        totalFiles: 0,
        totalVisualizations: 0,
        recentFiles: [],
        recentVisualizations: [],
        savedVisualizations: 0
      });
    };
    
    // Listen for login events to clear dashboard data
    const handleLogin = () => {
      console.log('Login event detected, clearing dashboard data');
      setStats({
        totalFiles: 0,
        totalVisualizations: 0,
        recentFiles: [],
        recentVisualizations: [],
        savedVisualizations: 0
      });
      // Re-fetch data immediately after login
      fetchData();
    };
    
    window.addEventListener('user-logout', handleLogout);
    window.addEventListener('user-login', handleLogin);
    
    return () => {
      window.removeEventListener('user-logout', handleLogout);
      window.removeEventListener('user-login', handleLogin);
    };
  }, []);

  const handleUploadClick = () => {
    navigate('/files', { state: { openUploadDialog: true } });
  };

  const handleVisualizationClick = () => {
    navigate('/visualizations', { state: { openCreateDialog: true } });
  };

  const handleRefresh = () => {
    // Refresh stats by calling the API again
    fetchData();
    // Also check server status
    checkServerStatus();
  };

  // Add a function to check server status
  const checkServerStatus = async () => {
    try {
      // Check if the API server is reachable
      const healthResponse = await fetch('/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Server status:', healthData);
      } else {
        console.error('Health check failed:', healthResponse.status, healthResponse.statusText);
      }
    } catch (error) {
      console.error('Error checking server status:', error);
    }
  };

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

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
    <Box>
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
        <Grid item xs={12} md={3}>
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
                {stats.totalFiles === 0 ? 'No files uploaded yet' : 'Files available'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
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
                {stats.totalVisualizations === 0 ? 'No visualizations created yet' : 'Visualizations created'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader
              title="Saved Visualizations"
              avatar={<SaveIcon />}
            />
            <CardContent>
              <Typography variant="h4" component="div">
                {loading ? '...' : stats.savedVisualizations || 0}
              </Typography>
              <Typography color="text.secondary">
                {!stats.savedVisualizations || stats.savedVisualizations === 0 
                  ? 'No saved visualizations yet' 
                  : 'Visualizations saved'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
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
                    'No recent activity' : 'Recent activity')}
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
