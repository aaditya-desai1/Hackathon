import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Grid, Button, Card, CardContent, 
  CardActions, CardHeader, IconButton, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { fetchApi } from '../services/api';
import { Chart } from 'react-chartjs-2';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { generateChartConfig, fetchChartDataFromAPI } from '../utils/chartUtils';

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'scatter', label: 'Scatter Plot' }
];

const Visualizations = () => {
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileColumns, setFileColumns] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVisualization, setEditingVisualization] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [visualizationName, setVisualizationName] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const navigate = useNavigate();
  const chartRefs = useRef({});
  
  useEffect(() => {
    fetchVisualizations();
    fetchFiles();
  }, []);
  
  const fetchVisualizations = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/api/visualizations');
      const data = await response.json();
      
      if (data.success) {
        setVisualizations(data.visualizations || []);
      } else {
        setError('Failed to fetch visualizations');
      }
    } catch (err) {
      console.error('Error fetching visualizations:', err);
      setError('Network error while fetching visualizations');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFiles = async () => {
    try {
      const response = await fetchApi('/api/files');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };
  
  const fetchFileColumns = async (fileId) => {
    try {
      const response = await fetchApi(`/api/files/${fileId}/columns`);
      const data = await response.json();
      
      if (data.success) {
        setFileColumns(data.columns || []);
        
        // Auto-select first column as X axis if available
        if (data.columns && data.columns.length > 0) {
          setXAxis(data.columns[0]);
          
          // Auto-select second column as Y axis if available
          if (data.columns.length > 1) {
            setYAxis(data.columns[1]);
          }
        }
      } else {
        setFileColumns([]);
        setError('Failed to fetch file columns');
      }
    } catch (err) {
      console.error('Error fetching file columns:', err);
      setFileColumns([]);
    }
  };
  
  const handleCreateVisualization = () => {
    setCreatingNew(true);
    setEditingVisualization(null);
    setSelectedFile('');
    setFileColumns([]);
    setChartType('bar');
    setXAxis('');
    setYAxis('');
    setVisualizationName('');
    setDialogOpen(true);
  };
  
  const handleEditVisualization = (visualization) => {
    setCreatingNew(false);
    setEditingVisualization(visualization);
    setSelectedFile(visualization.fileId);
    setChartType(visualization.chartType || 'bar');
    setXAxis(visualization.xAxis || '');
    setYAxis(visualization.yAxis || '');
    setVisualizationName(visualization.name || '');
    fetchFileColumns(visualization.fileId);
    setDialogOpen(true);
  };
  
  const handleDeleteVisualization = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visualization?')) {
      return;
    }
    
    try {
      const response = await fetchApi(`/api/visualizations/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove the deleted visualization from state
        setVisualizations(visualizations.filter(v => v._id !== id));
      } else {
        setError('Failed to delete visualization');
      }
    } catch (err) {
      console.error('Error deleting visualization:', err);
      setError('Network error while deleting visualization');
    }
  };
  
  const handleFileChange = (e) => {
    const fileId = e.target.value;
    setSelectedFile(fileId);
    fetchFileColumns(fileId);
  };
  
  const handleSaveVisualization = async () => {
    if (!selectedFile || !xAxis || !yAxis || !chartType || !visualizationName) {
      alert('Please fill in all required fields');
      return;
    }
    
    const visualizationData = {
      name: visualizationName,
      fileId: selectedFile,
      chartType,
      xAxis,
      yAxis
    };
    
    try {
      let response;
      
      if (creatingNew) {
        response = await fetchApi('/api/visualizations', {
          method: 'POST',
          body: JSON.stringify(visualizationData)
        });
      } else {
        response = await fetchApi(`/api/visualizations/${editingVisualization._id}`, {
          method: 'PUT',
          body: JSON.stringify(visualizationData)
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh visualizations
        fetchVisualizations();
        setDialogOpen(false);
      } else {
        setError(data.error || 'Failed to save visualization');
      }
    } catch (err) {
      console.error('Error saving visualization:', err);
      setError('Network error while saving visualization');
    }
  };
  
  const getChartData = async (chart) => {
    try {
      if (!chart || !chart.fileId || !chart.yAxis) {
        return null;
      }
      
      return await fetchChartDataFromAPI(chart);
    } catch (err) {
      console.error('Error getting chart data:', err);
      return null;
    }
  };
  
  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Visualizations
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateVisualization}
        >
          Create Visualization
        </Button>
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : visualizations.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No visualizations yet. Create your first visualization!
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={handleCreateVisualization}
          >
            Create Visualization
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {visualizations.map((visualization) => (
            <Grid item xs={12} sm={6} md={4} key={visualization._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={visualization.name}
                  subheader={`${visualization.chartType || 'Bar'} Chart`}
                  action={
                    <>
                      <IconButton 
                        aria-label="edit"
                        onClick={() => handleEditVisualization(visualization)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        aria-label="delete"
                        onClick={() => handleDeleteVisualization(visualization._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ height: 200, position: 'relative' }}>
                    <ChartPreview 
                      visualization={visualization} 
                      getChartData={getChartData}
                      chartRefs={chartRefs}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/visualizations/${visualization._id}`)}
                  >
                    View Full Size
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Create/Edit Visualization Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {creatingNew ? 'Create New Visualization' : 'Edit Visualization'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Visualization Name"
            fullWidth
            margin="normal"
            value={visualizationName}
            onChange={(e) => setVisualizationName(e.target.value)}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Data Source</InputLabel>
            <Select
              value={selectedFile}
              onChange={handleFileChange}
            >
              <MenuItem value="">
                <em>Select a file</em>
              </MenuItem>
              {files.map((file) => (
                <MenuItem key={file._id} value={file._id}>
                  {file.originalName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              {CHART_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>X Axis</InputLabel>
            <Select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              disabled={fileColumns.length === 0}
            >
              {fileColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Y Axis</InputLabel>
            <Select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              disabled={fileColumns.length === 0}
            >
              {fileColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveVisualization} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Chart Preview Component
const ChartPreview = ({ visualization, getChartData, chartRefs }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        const data = await getChartData(visualization);
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    
    loadChartData();
  }, [visualization, getChartData]);
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%' 
      }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error || !chartData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%' 
      }}>
        <Typography color="error" variant="body2">
          {error || 'Unable to load chart data'}
        </Typography>
      </Box>
    );
  }
  
  const chartConfig = generateChartConfig(chartData, visualization.chartType || 'bar');
  
  return (
    <Chart
      type={chartConfig.type}
      data={chartConfig.data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: ['pie', 'doughnut'].includes(visualization.chartType),
            position: 'bottom',
          },
        }
      }}
      ref={el => {
        if (el) {
          chartRefs.current[visualization._id] = el;
        }
      }}
    />
  );
};

export default Visualizations; 