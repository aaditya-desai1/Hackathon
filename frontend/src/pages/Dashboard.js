import React from 'react';
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
} from '@mui/material';
import {
  Description as FileIcon,
  BarChart as ChartIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';

function Dashboard() {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate('/files', { state: { openUploadDialog: true } });
  };

  const handleVisualizationClick = () => {
    navigate('/visualizations', { state: { openCreateDialog: true } });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Dashboard" 
        icon={<ChartIcon />}
        actions={
          <Tooltip title="Refresh">
            <IconButton>
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
                0
              </Typography>
              <Typography color="text.secondary">
                No files uploaded yet
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
                0
              </Typography>
              <Typography color="text.secondary">
                No visualizations created yet
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
                0
              </Typography>
              <Typography color="text.secondary">
                No recent activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

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