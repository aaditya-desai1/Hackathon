import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Alert,
  IconButton,
  useTheme,
  CircularProgress,
  Paper,
  Container,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart as ChartIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  BubbleChart as ScatterIcon,
  ShowChart as LineIcon,
  PieChart as PieIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import Chart from 'chart.js/auto';

function Visualizations() {
  const theme = useTheme();
  const location = useLocation();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const chartContainerRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState('');
  const [showChartOptions, setShowChartOptions] = useState(false);
  const [previewCharts, setPreviewCharts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [axisSelectionOpen, setAxisSelectionOpen] = useState(false);
  const chartPreviewRefs = useRef({});
  const [chartPreviewInstances, setChartPreviewInstances] = useState({});
  const [fileNotFound, setFileNotFound] = useState(false);

  useEffect(() => {
    fetchFiles();
    fetchVisualizations();
    
    if (location.state?.openCreateDialog) {
      setOpenDialog(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files');
    }
  };

  const fetchVisualizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visualizations');
      const data = await response.json();
      console.log('Fetched visualizations:', data);
      setVisualizations(data.visualizations || []);
    } catch (error) {
      console.error('Error fetching visualizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    // Clear existing preview charts when selecting a new file
    setPreviewCharts([]);
    setChartPreviewInstances({});
    
    setSelectedFile(file);
    setLoading(true);
    setError(null);
    setSelectedXAxis('');
    setSelectedYAxis('');
    setShowChartOptions(false);
    
    try {
      console.log('Analyzing file with ID:', file._id);
      const response = await fetch(`/api/files/${file._id}/analyze`);
      console.log('Analysis response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analysis error details:', errorData);
        throw new Error(errorData.error || 'Analysis failed');
      }
      
      const analysisData = await response.json();
      console.log('Analysis result:', analysisData);
      
      // Check the structure of analysis data and adapt as needed
      if (analysisData.success && analysisData.analysis) {
        // Extract column types from analysis
        const columnTypes = {};
        Object.keys(analysisData.analysis.basicAnalysis || {}).forEach(column => {
          columnTypes[column] = analysisData.analysis.basicAnalysis[column].type;
        });
        
        // Find best columns for different chart types
        const dateColumns = Object.keys(columnTypes).filter(col => columnTypes[col] === 'date');
        const numericColumns = Object.keys(columnTypes).filter(col => columnTypes[col] === 'number');
        const categoricalColumns = Object.keys(columnTypes).filter(col => columnTypes[col] === 'string');
        
        // Find correlations between numeric columns
        const correlations = analysisData.analysis.advancedAnalysis?.correlations || {};
        
        // Default axes if can't determine from analysis
        let defaultXAxis = Object.keys(analysisData.analysis.basicAnalysis || {})[0];
        let defaultYAxis = numericColumns[0] || Object.keys(analysisData.analysis.basicAnalysis || {})[1];
        
        // Create axes recommendations based on data types
        let recommendedAxes = {
          bar: { 
            x: categoricalColumns[0] || defaultXAxis, 
            y: numericColumns[0] || defaultYAxis 
          },
          line: { 
            x: dateColumns[0] || categoricalColumns[0] || defaultXAxis, 
            y: numericColumns[0] || defaultYAxis 
          },
          pie: { 
            x: categoricalColumns[0] || defaultXAxis, 
            y: numericColumns[0] || defaultYAxis 
          },
          scatter: { 
            x: numericColumns[0] || defaultXAxis, 
            y: numericColumns[1] || numericColumns[0] || defaultYAxis 
          }
        };
        
        // Find highest correlation pair for scatter plot
        if (Object.keys(correlations).length > 0) {
          const correlationPairs = Object.entries(correlations);
          if (correlationPairs.length > 0) {
            correlationPairs.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
            const bestCorrelationPair = correlationPairs[0][0].split('_');
            recommendedAxes.scatter.x = bestCorrelationPair[0];
            recommendedAxes.scatter.y = bestCorrelationPair[1];
          }
        }
        
        setAnalysis({
          rowCount: analysisData.analysis.summary?.totalRows || 0,
          columns: Object.keys(analysisData.analysis.basicAnalysis || {}),
          columnTypes: columnTypes,
          visualizationSuggestions: [
            {
              type: 'bar',
              description: 'Bar Chart - Good for comparing values across categories',
              reasoning: 'Based on data structure',
              confidence: 85,
              xAxis: recommendedAxes.bar.x,
              yAxis: recommendedAxes.bar.y
            },
            {
              type: 'line',
              description: 'Line Chart - Best for showing trends over time or continuous data',
              reasoning: 'Good for trends over time',
              confidence: 75,
              xAxis: recommendedAxes.line.x,
              yAxis: recommendedAxes.line.y
            },
            {
              type: 'pie',
              description: 'Pie Chart - Excellent for showing proportions of a whole',
              reasoning: 'Good for showing proportions',
              confidence: 65,
              xAxis: recommendedAxes.pie.x,
              yAxis: recommendedAxes.pie.y
            },
            {
              type: 'scatter',
              description: 'Scatter Plot - Ideal for showing correlation between variables',
              reasoning: 'Good for showing correlations',
              confidence: 60,
              xAxis: recommendedAxes.scatter.x,
              yAxis: recommendedAxes.scatter.y
            }
          ]
        });
        
        // Automatically generate AI recommended visualizations
        generateAIRecommendedCharts(file, recommendedAxes, analysisData.analysis);
      } else {
        setAnalysis({
          rowCount: 0,
          columns: [],
          visualizationSuggestions: []
        });
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setError('Failed to analyze file');
    } finally {
      setLoading(false);
    }
  };

  // New function to automatically generate AI recommended charts
  const generateAIRecommendedCharts = (file, recommendedAxes, analysisData) => {
    // Create preview charts for all chart types with AI-recommended axes
    const previewData = [];
    
    // Create AI recommendations for different chart types
    ['bar', 'line', 'pie', 'scatter'].forEach(chartType => {
      const xAxis = recommendedAxes[chartType].x;
      const yAxis = recommendedAxes[chartType].y;
      
      if (xAxis && yAxis) {
        previewData.push({
          chartType,
          name: `${file.name} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
          description: `AI Recommended: ${yAxis} by ${xAxis}`,
          fileId: file._id,
          confidence: chartType === 'bar' ? 85 : chartType === 'line' ? 75 : chartType === 'pie' ? 65 : 60,
          xAxis: xAxis,
          yAxis: yAxis,
          file: file,
          isAIRecommended: true
        });
      }
    });
    
    setPreviewFile(file);
    setPreviewCharts(previewData);
    
    // Close the file selection dialog
    setOpenDialog(false);
    
    // Schedule rendering after the DOM updates
    setTimeout(() => {
      renderPreviewCharts(previewData);
    }, 300);
  };

  const handleCreateClick = () => {
    setOpenDialog(true);
    setSelectedXAxis('');
    setSelectedYAxis('');
    setAxisSelectionOpen(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAxisSelectionOpen(false);
    setSelectedFile(null);
    setAnalysis(null);
  };

  const handleGenerateCharts = () => {
    if (!selectedFile || !analysis || !selectedXAxis || !selectedYAxis) {
      setError('Please select file and axes first');
      return;
    }
    
    // Close both dialogs
    setAxisSelectionOpen(false);
    setOpenDialog(false);
    
    // Create preview charts for all chart types
    const previewData = [];
    ['bar', 'line', 'pie', 'scatter'].forEach(chartType => {
      const suggestion = analysis.visualizationSuggestions.find(s => s.type === chartType) || {
        type: chartType,
        confidence: chartType === 'bar' ? 85 : chartType === 'line' ? 75 : chartType === 'pie' ? 65 : 60
      };
      
      previewData.push({
        chartType,
        name: `${selectedFile.name} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
        description: `Custom Chart: ${selectedYAxis} by ${selectedXAxis}`,
        fileId: selectedFile._id,
        confidence: suggestion.confidence,
        xAxis: selectedXAxis,
        yAxis: selectedYAxis,
        file: selectedFile,
        isAIRecommended: false
      });
    });
    
    setPreviewFile(selectedFile);
    setPreviewCharts(prevCharts => {
      // Maintain existing AI-recommended charts if any
      const aiCharts = prevCharts.filter(chart => chart.isAIRecommended);
      return [...aiCharts, ...previewData];
    });
    
    // Schedule rendering after the DOM updates
    setTimeout(() => {
      renderPreviewCharts(previewData);
    }, 300);
  };

  const renderPreviewCharts = (charts) => {
    console.log('Rendering preview charts:', charts.length);
    
    // Clean up existing chart instances
    Object.values(chartPreviewInstances).forEach(instance => {
      if (instance) {
        console.log('Destroying existing chart instance');
        instance.destroy();
      }
    });
    
    const newInstances = {};
    
    // Create chart instances for each chart type
    charts.forEach((chart, index) => {
      // Generate a consistent key for each chart
      const chartKey = chart.isAIRecommended ? 
        `ai-${chart.chartType}` : 
        `custom-${chart.chartType}-${chart.xAxis}-${chart.yAxis}`;
      
      console.log(`Setting up chart: ${chartKey}`);
      
      // Schedule creation of chart instance after DOM update
      setTimeout(() => {
        if (chartPreviewRefs.current[chartKey]) {
          console.log(`Creating chart instance for ${chartKey}`);
          createChartInstance(chartKey, chart, newInstances);
        } else {
          console.warn(`Canvas reference not found for ${chartKey}`);
        }
      }, 500); // Increased timeout to ensure DOM is ready
    });
    
    setChartPreviewInstances(newInstances);
  };
  
  const createChartInstance = async (chartKey, chart, instancesObject) => {
    // Destroy existing chart if any
    if (instancesObject[chartKey]) {
      instancesObject[chartKey].destroy();
      delete instancesObject[chartKey];
    }
    
    // Get the canvas element
    const canvas = chartPreviewRefs.current[chartKey];
    if (!canvas) return;
    
    // Clear any existing Chart instances attached to this canvas
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Attempt to fetch real data if possible
    let chartData = {
      labels: ['Loading...'],
      datasets: [{
        label: chart.yAxis || 'Value',
        data: [0],
        backgroundColor: theme.palette.primary.main
      }]
    };
    
    try {
      // Fetch chart data from backend
      if (chart.fileId && chart.xAxis && chart.yAxis) {
        const response = await fetch(
          `/api/data/chart?fileId=${chart.fileId}&xAxis=${chart.xAxis}&yAxis=${chart.yAxis}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.chartData) {
            // Format the data based on chart type
            const backgroundColor = [
              '#1976d2', // Blue (Primary)
              '#9c27b0', // Purple
              '#2e7d32', // Green
              '#ed6c02', // Orange
              '#d32f2f', // Red
              '#0288d1', // Light Blue
              '#388e3c', // Light Green
              '#f57c00', // Deep Orange
              '#512da8', // Deep Purple
              '#00796b', // Teal
            ];
            
            // Process data based on chart type
            if (chart.chartType === 'pie') {
              chartData = {
                labels: data.chartData.labels,
                datasets: [{
                  label: chart.yAxis,
                  data: data.chartData.values,
                  backgroundColor: backgroundColor,
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  borderWidth: 1
                }]
              };
            } else {
              chartData = {
                labels: data.chartData.labels,
                datasets: [{
                  label: chart.yAxis,
                  data: data.chartData.values,
                  backgroundColor: chart.chartType === 'bar' ? backgroundColor : backgroundColor[0],
                  borderColor: chart.chartType === 'line' || chart.chartType === 'scatter' ? backgroundColor[0] : undefined,
                  borderWidth: chart.chartType === 'line' ? 2 : 1,
                  pointBackgroundColor: chart.chartType === 'scatter' || chart.chartType === 'line' ? backgroundColor[0] : undefined,
                  pointRadius: chart.chartType === 'scatter' ? 5 : chart.chartType === 'line' ? 3 : 0,
                  fill: chart.chartType === 'line' ? false : undefined
                }]
              };
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Use default data if real data fetch fails
      chartData = {
        labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'],
        datasets: [{
          label: chart.yAxis || 'Value',
          data: [65, 59, 80, 81, 56],
          backgroundColor: [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
          ]
        }]
      };
    }
    
    // Configure the chart type and options
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
      },
      plugins: {
        legend: {
          position: chart.chartType === 'pie' ? 'right' : 'top',
          labels: {
            color: theme.palette.text.primary,
            font: {
              size: 12
            }
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
      scales: chart.chartType === 'pie' ? undefined : {
        x: {
          title: {
            display: true,
            text: chart.xAxis,
            color: theme.palette.text.primary
          },
          ticks: {
            color: theme.palette.text.secondary
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }
        },
        y: {
          title: {
            display: true,
            text: chart.yAxis,
            color: theme.palette.text.primary
          },
          ticks: {
            color: theme.palette.text.secondary
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          },
          beginAtZero: true
        }
      }
    };

    try {
      // Create the chart instance
      const chartInstance = new Chart(ctx, {
        type: chart.chartType,
        data: chartData,
        options: options
      });
      
      // Store the instance
      instancesObject[chartKey] = chartInstance;
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  };

  const handleSaveChart = async (chart) => {
    try {
      // Save the chart as an image
      const canvasRef = chartPreviewRefs.current[chart.chartType];
      if (canvasRef) {
        // Get the image data URL
        const imageUrl = canvasRef.toDataURL("image/png");
        
        // Create a temporary link element to download the image
        const downloadLink = document.createElement("a");
        downloadLink.href = imageUrl;
        downloadLink.download = `${chart.name}.png`;
        
        // Append to body, click, and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log("Chart image saved locally");
        
        // Success message
        alert("Chart saved to your downloads folder");
      }
      
      // Ask if the user wants to save to the server as well
      const saveToServer = window.confirm("Do you also want to save this visualization to your account?");
      if (!saveToServer) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Create a basic config from the selected axes
      const config = {
        xAxis: {
          field: chart.xAxis,
          label: chart.xAxis
        },
        yAxis: {
          field: chart.yAxis,
          label: chart.yAxis
        },
        title: chart.name,
        subtitle: `Generated on ${new Date().toLocaleDateString()}`
      };
      
      // Send request to create visualization
      const response = await fetch('/api/visualizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: chart.name,
          description: chart.description,
          fileId: chart.fileId,
          chartType: chart.chartType,
          confidence: chart.confidence,
          config: config,
          isAIGenerated: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create visualization');
      }
      
      const result = await response.json();
      console.log('Visualization created:', result);
      
      // Show success message
      alert('Visualization saved successfully to your account!');
      
      // Refresh visualizations
      await fetchVisualizations();
    } catch (error) {
      console.error('Error creating visualization:', error);
      setError('Failed to create visualization: ' + error.message);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVisualization = async (viz) => {
    try {
      // Get the visualization details
      const response = await fetch(`/api/visualizations/${viz._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch visualization details');
      }
      
      const data = await response.json();
      console.log('Visualization details:', data.visualization);
      
      // Fix id inconsistency by ensuring we have _id
      if (data.visualization.id && !data.visualization._id) {
        data.visualization._id = data.visualization.id;
      }
      
      setCurrentVisualization(data.visualization);
      setOpenViewDialog(true);
      
      // We need to render the chart after the dialog is open and DOM is ready
      setTimeout(() => {
        renderChart(data.visualization);
      }, 300);
    } catch (error) {
      console.error('Error viewing visualization:', error);
      alert('Failed to load visualization details');
    }
  };
  
  const handleEditVisualization = async (viz) => {
    try {
      // Get the visualization details
      const response = await fetch(`/api/visualizations/${viz._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch visualization details');
      }
      
      const data = await response.json();
      setCurrentVisualization(data.visualization);
      setOpenEditDialog(true);
    } catch (error) {
      console.error('Error editing visualization:', error);
      alert('Failed to load visualization for editing');
    }
  };
  
  const handleUpdateVisualization = async () => {
    if (!currentVisualization) return;
    
    try {
      const response = await fetch(`/api/visualizations/${currentVisualization._id || currentVisualization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: currentVisualization.name,
          description: currentVisualization.description,
          chartType: currentVisualization.chartType,
          config: currentVisualization.config
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update visualization');
      }
      
      // Close dialog and refresh visualizations
      setOpenEditDialog(false);
      setCurrentVisualization(null);
      await fetchVisualizations();
    } catch (error) {
      console.error('Error updating visualization:', error);
      alert('Failed to update visualization');
    }
  };
  
  const handleCloseViewDialog = () => {
    if (chartInstance) {
      chartInstance.destroy();
      setChartInstance(null);
    }
    setOpenViewDialog(false);
    setCurrentVisualization(null);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentVisualization(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVisualization(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteVisualization = async (vizId) => {
    setDeleteTarget(vizId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      console.error('No delete target set');
      alert('Error: No visualization selected for deletion');
      setOpenDeleteDialog(false);
      return;
    }

    try {
      console.log('Deleting visualization with ID:', deleteTarget);
      
      const response = await fetch(`/api/visualizations/${deleteTarget}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Delete error details:', errorData);
        throw new Error(errorData.message || 'Failed to delete visualization');
      }
      
      console.log('Visualization deleted successfully');
      alert('Visualization deleted successfully');
      
      // Refresh the list
      await fetchVisualizations();
    } catch (error) {
      console.error('Error deleting visualization:', error);
      alert(`Failed to delete visualization: ${error.message}`);
    } finally {
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setDeleteTarget(null);
  };

  const getVisualizationIcon = (type) => {
    const iconSize = { fontSize: 80, opacity: 0.8 };
    const colors = {
      bar: '#1976d2',    // blue
      scatter: '#9c27b0', // purple
      line: '#2e7d32',    // green
      pie: '#ed6c02'      // orange
    };
    
    const iconColor = { color: colors[type] || colors.bar };
    
    switch (type) {
      case 'bar':
        return <ChartIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'scatter':
        return <ScatterIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'line':
        return <LineIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'pie':
        return <PieIcon sx={{ ...iconSize, ...iconColor }} />;
      default:
        return <TimelineIcon sx={{ ...iconSize, ...iconColor }} />;
    }
  };

  const renderPlaceholder = () => {
    if (loading) {
      return (
        <Grid item xs={12}>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
            <Typography sx={{ mt: 1 }} align="center" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </Grid>
      );
    }
    
    if (visualizations.length === 0) {
      return (
        <Grid item xs={12}>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 4 }}>
            No visualizations yet. Click the "Create Visualization" button to create one.
          </Typography>
        </Grid>
      );
    }
    
    return null;
  };

  const renderChart = (visualization) => {
    if (!chartContainerRef.current || !visualization) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const ctx = chartContainerRef.current.getContext('2d');
    if (!ctx) return;

    // Configure chart options
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: theme.palette.text.primary,
            font: {
              family: theme.typography.fontFamily,
            }
          }
        },
        title: {
          display: true,
          text: visualization.title || visualization.name || 'Chart',
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
          titleColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
          bodyColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: visualization.xAxis || visualization.config?.xAxis?.label || 'X Axis',
            color: theme.palette.text.primary
          },
          ticks: {
            color: theme.palette.text.secondary
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }
        },
        y: {
          title: {
            display: true,
            text: visualization.yAxis || visualization.config?.yAxis?.label || 'Y Axis',
            color: theme.palette.text.primary
          },
          ticks: {
            color: theme.palette.text.secondary
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }
        }
      }
    };

    // Default data for different chart types
    let data;
    const chartType = visualization.chartType || 'bar';
    
    try {
      if (chartType === 'scatter') {
        // For scatter charts, create paired x-y coordinates with realistic data
        data = {
          datasets: [{
            label: visualization.config?.yAxis?.label || visualization.yAxis || 'Value',
            data: [
              { x: 20, y: 45 },
              { x: 25, y: 55 },
              { x: 30, y: 65 },
              { x: 35, y: 75 },
              { x: 40, y: 70 },
              { x: 45, y: 60 }
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 7,
            pointHoverRadius: 9,
          }]
        };
      } else if (chartType === 'pie') {
        // For pie charts
        const labels = ['20-25', '25-30', '30-35', '35-40', '40-45', '45-50'];
        data = {
          labels: labels,
          datasets: [{
            label: visualization.config?.yAxis?.label || visualization.yAxis || 'Value',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        };
      } else {
        // For bar and line charts
        const labels = ['20', '25', '30', '35', '40', '45'];
        data = {
          labels: labels,
          datasets: [{
            label: visualization.config?.yAxis?.label || visualization.yAxis || 'Value',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ],
            borderColor: chartType === 'line' ? 'rgba(75, 192, 192, 1)' : [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1,
            tension: 0.1
          }]
        };
      }
      
      // Create the chart based on the type
      console.log('Creating new chart');
      const newChart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
      });
      
      console.log('Chart created successfully');
      setChartInstance(newChart);
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  };

  // Add a separate useEffect to render the chart when visualization changes
  useEffect(() => {
    if (currentVisualization && openViewDialog) {
      // Use setTimeout to ensure the dialog is fully rendered
      setTimeout(() => {
        renderChart(currentVisualization);
      }, 300);
    }
  }, [currentVisualization, openViewDialog, theme]);

  // Clean up chart instance on component unmount
  useEffect(() => {
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      Object.values(chartPreviewInstances).forEach(instance => {
        if (instance) instance.destroy();
      });
    };
  }, [chartInstance, chartPreviewInstances]);

  // Save visualization data to localStorage (more persistent than sessionStorage)
  useEffect(() => {
    if (previewCharts.length > 0) {
      localStorage.setItem('previewCharts', JSON.stringify(previewCharts));
      
      if (previewFile) {
        localStorage.setItem('previewFile', JSON.stringify(previewFile));
      }
    }
  }, [previewCharts, previewFile]);
  
  // Restore saved charts and check file validity
  useEffect(() => {
    const restoreAndValidateCharts = async () => {
      // Only restore charts if we don't already have any loaded
      if (previewCharts.length === 0) {
        const savedPreviewCharts = localStorage.getItem('previewCharts');
        const savedPreviewFile = localStorage.getItem('previewFile');
        
        console.log('Checking for saved charts to restore:', {
          haveCharts: Boolean(savedPreviewCharts),
          haveFile: Boolean(savedPreviewFile)
        });
        
        if (savedPreviewCharts && savedPreviewFile) {
          try {
            const parsedFile = JSON.parse(savedPreviewFile);
            const parsedCharts = JSON.parse(savedPreviewCharts);
            
            console.log('Restoring charts from localStorage:', {
              fileName: parsedFile.name,
              chartCount: parsedCharts.length
            });
            
            // Check if the file still exists
            const response = await fetch(`/api/files/${parsedFile._id}`);
            if (!response.ok) {
              // File doesn't exist anymore, but still show visualizations with warning
              console.log('Saved file no longer exists, showing warning');
              setPreviewFile(parsedFile);
              setPreviewCharts(parsedCharts);
              setFileNotFound(true);
            } else {
              // File exists, restore visualizations
              console.log('File exists, restoring visualizations');
              setPreviewFile(parsedFile);
              setPreviewCharts(parsedCharts);
              setFileNotFound(false);
            }
            
            // Schedule rendering after component mounts
            setTimeout(() => {
              console.log('Rendering restored charts...');
              renderPreviewCharts(parsedCharts);
            }, 300);
          } catch (error) {
            console.error('Error restoring saved charts:', error);
            // Clear invalid data
            localStorage.removeItem('previewCharts');
            localStorage.removeItem('previewFile');
          }
        }
      } else {
        console.log('Already have charts loaded, not restoring from localStorage', {
          currentChartCount: previewCharts.length
        });
      }
    };
    
    restoreAndValidateCharts();
  }, [previewCharts.length]);

  // Update UI to show file not found warning
  useEffect(() => {
    const validateExistingPreviewFile = async () => {
      // Check if the preview file still exists
      if (previewFile && previewFile._id) {
        try {
          const response = await fetch(`/api/files/${previewFile._id}`);
          if (!response.ok) {
            // File doesn't exist anymore, show warning but keep visualizations
            console.log('Preview file no longer exists, showing warning');
            setFileNotFound(true);
          } else {
            setFileNotFound(false);
          }
        } catch (error) {
          console.error('Error checking file existence:', error);
          setFileNotFound(true);
        }
      }
    };
    
    if (previewFile) {
      validateExistingPreviewFile();
    } else {
      setFileNotFound(false);
    }
  }, [previewFile]);

  // Add recommended visualizations section with previews
  const renderRecommendedVisualizations = () => {
    if (!analysis?.visualizationSuggestions?.length) return null;

  return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recommended Visualizations
        </Typography>
        <Grid container spacing={2}>
          {analysis.visualizationSuggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                  border: 1,
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }}
                onClick={() => {
                  setSelectedXAxis(suggestion.xAxis || analysis.columns[0]);
                  setSelectedYAxis(suggestion.yAxis || analysis.columns[1]);
                  handleGenerateCharts();
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Chart
                  </Typography>
                  <Chip
                    label={`${suggestion.confidence}% match`}
                    color="primary"
                    size="small"
                  />
                </Box>
                
                <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {suggestion.type === 'bar' && <ChartIcon sx={{ fontSize: 50, color: '#1976d2' }} />}
                  {suggestion.type === 'line' && <LineIcon sx={{ fontSize: 50, color: '#2e7d32' }} />}
                  {suggestion.type === 'pie' && <PieIcon sx={{ fontSize: 50, color: '#ed6c02' }} />}
                  {suggestion.type === 'scatter' && <ScatterIcon sx={{ fontSize: 50, color: '#9c27b0' }} />}
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {suggestion.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // New function to clear all visualizations
  const handleClearVisualizations = () => {
    // Clean up chart instances
    Object.values(chartPreviewInstances).forEach(instance => {
      if (instance) instance.destroy();
    });
    
    setPreviewCharts([]);
    setChartPreviewInstances({});
    setPreviewFile(null);
    
    // Also clear from localStorage
    localStorage.removeItem('previewCharts');
    localStorage.removeItem('previewFile');
    
    // Show a brief confirmation
    setError(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <PageHeader
          title="Visualizations"
          subtitle="Create and manage your data visualizations"
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              {previewCharts.length > 0 && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleClearVisualizations}
                >
                  New Visualization
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Visualization
              </Button>
            </Box>
          }
        />

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Show file not found message when appropriate */}
        {fileNotFound && previewCharts.length > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleClearVisualizations}
              >
                Clear Visualizations
              </Button>
            }
          >
            The file <strong>{previewFile?.name}</strong> used to generate these visualizations has been deleted.
            You can still view the charts, but you won't be able to update them.
          </Alert>
        )}
        
        {!fileNotFound && previewCharts.length > 0 && previewFile && (
          <Box>
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleClearVisualizations}
                >
                  Clear All
                </Button>
              }
            >
              Showing visualizations for file: <strong>{previewFile.name}</strong>
            </Alert>
          </Box>
        )}

        {/* AI Recommended Visualizations Section */}
        {previewCharts.filter(chart => chart.isAIRecommended).length > 0 && (
          <Paper sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                AI Recommended Visualizations
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Based on your data structure, here are the most effective visualizations for {previewFile?.name}
            </Typography>
            
            <Grid container spacing={3}>
              {previewCharts.filter(chart => chart.isAIRecommended).map((chart, index) => (
                <Grid item xs={12} sm={6} key={`ai-${chart.chartType}-${index}`}>
                  <Card sx={{ 
                    height: '100%',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" component="div">
                        {chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)} Chart
                      </Typography>
                      <Chip 
                        label={`${chart.confidence}% match`} 
                        color={chart.confidence > 80 ? 'success' : chart.confidence > 70 ? 'primary' : 'default'} 
                        size="small"
                        sx={{ fontWeight: 'bold', color: 'white', bgcolor: chart.confidence > 80 ? '#2e7d32' : chart.confidence > 70 ? '#1976d2' : '#757575' }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }}>
                      {chart.description}
                    </Typography>
                    <Box sx={{ p: 2, height: 250, position: 'relative', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white' }}>
                      <canvas 
                        ref={el => chartPreviewRefs.current[`ai-${chart.chartType}`] = el}
                        style={{ width: '100%', height: '100%' }}
                        id={`chart-ai-${chart.chartType}-${index}`}
                      />
                    </Box>
                    <Box sx={{ p: 2, mt: 'auto' }}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleSaveChart(chart)}
                        disabled={fileNotFound}
                      >
                        Save Visualization
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setOpenDialog(true);
                  setAxisSelectionOpen(true);
                }}
              >
                Create Custom Chart
              </Button>
            </Box>
          </Paper>
        )}
        
        {/* Custom Visualizations Section */}
        {previewCharts.filter(chart => !chart.isAIRecommended).length > 0 && (
          <Paper sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                Custom Visualizations
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {previewCharts.filter(chart => !chart.isAIRecommended).map((chart, index) => (
                <Grid item xs={12} sm={6} key={`custom-${chart.chartType}-${index}`}>
                  <Card sx={{ 
                    height: '100%',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" component="div">
                        {chart.chartType.charAt(0).toUpperCase() + chart.chartType.slice(1)} Chart
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }}>
                      {chart.yAxis} by {chart.xAxis}
                    </Typography>
                    <Box sx={{ p: 2, height: 250, position: 'relative', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white' }}>
                      <canvas 
                        ref={el => chartPreviewRefs.current[`custom-${chart.chartType}-${chart.xAxis}-${chart.yAxis}`] = el}
                        style={{ width: '100%', height: '100%' }}
                        id={`chart-custom-${chart.chartType}-${index}`}
                      />
                    </Box>
                    <Box sx={{ p: 2, mt: 'auto' }}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleSaveChart(chart)}
                        disabled={fileNotFound}
                      >
                        Save Visualization
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Placeholder when no visualizations are available */}
        {previewCharts.length === 0 && !loading && (
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
            <ChartIcon sx={{ width: 80, height: 80, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No visualizations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 4 }}>
              Create your first visualization by uploading a file. We'll automatically recommend the best charts for your data.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Create Visualization
            </Button>
          </Box>
        )}

        {/* Saved Visualizations Section */}
        {visualizations.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Saved Visualizations
            </Typography>
            <Grid container spacing={3}>
              {visualizations.map((viz) => (
                <Grid item xs={12} sm={6} key={viz._id}>
                  <Card sx={{ 
                    height: '100%',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="h6" component="div">
                        {viz.name}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' }}>
                      {viz.description}
                    </Typography>
                    <Box sx={{ p: 2, height: 250, position: 'relative', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white' }}>
                      <canvas 
                        ref={el => chartPreviewRefs.current[`viz-${viz._id}`] = el}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                    <Box sx={{ p: 2, mt: 'auto' }}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleViewVisualization(viz)}
                      >
                        View
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* File Selection Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {axisSelectionOpen ? 'Create Custom Visualization' : 'Create Visualization'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, color: 'text.secondary' }}>
            {axisSelectionOpen 
              ? 'Choose a file and configure custom chart settings:' 
              : 'Choose a file to analyze and visualize:'}
          </Typography>
          
          {!axisSelectionOpen && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                When you select a file, our AI will automatically generate the best visualizations based on your data.
              </Typography>
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Analyzing your data and generating recommendations...
              </Typography>
            </Box>
          ) : (
            <List sx={{ 
              borderRadius: 1, 
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
              overflow: 'hidden',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f8f8'
            }}>
              {files.map((file) => (
                <ListItem
                  key={file._id}
                  button
                  divider
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white', 
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(25, 118, 210, 0.08)'
                    }
                  }}
                  onClick={() => {
                    if (axisSelectionOpen) {
                      // If in custom chart mode, just select the file but don't auto-generate
                      setSelectedFile(file);
                    } else {
                      // Otherwise, trigger AI analysis
                      handleFileSelect(file);
                    }
                  }}
                >
                  <ListItemIcon>
                    <ChartIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography fontWeight="medium">{file.name}</Typography>}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          size="small" 
                          label={file.type.split('/')[1].toUpperCase()} 
                          color={file.type.includes('csv') ? 'success' : file.type.includes('json') ? 'info' : 'primary'}
                          sx={{ mr: 1, height: 20, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'flex-end',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
        </Box>
      </Dialog>

      {/* Axis Selection Dialog */}
      <Dialog
        open={axisSelectionOpen}
        onClose={() => {
          setAxisSelectionOpen(false);
          setError(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 2, 
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6">
            Select Data for Visualization
          </Typography>
          <Chip 
            label={selectedFile?.name || 'No file selected'} 
            size="small" 
            color="default"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: 1,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }}>
                <Box>
                  <Typography variant="h6">Data Summary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analysis?.rowCount} rows analyzed across {analysis?.columns?.length} columns
                  </Typography>
                </Box>
                <Chip 
                  label="Ready for visualization" 
                  color="success" 
                  icon={<CheckCircleIcon />} 
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Select Data Axes
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom color="text.secondary">
                    X-Axis (Categories)
                  </Typography>
                  <Box sx={{ 
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                    borderRadius: 1, 
                    p: 0,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white' 
                  }}>
                    <Select
                      value={selectedXAxis}
                      onChange={(e) => setSelectedXAxis(e.target.value)}
                      displayEmpty
                      fullWidth
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
                            color: theme.palette.text.primary,
                          }
                        }
                      }}
                      sx={{
                        height: '56px',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '& .MuiSelect-icon': {
                          color: theme.palette.text.secondary,
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select X-Axis Column
                      </MenuItem>
                      {analysis?.columns.map((column) => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom color="text.secondary">
                    Y-Axis (Values)
                  </Typography>
                  <Box sx={{ 
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    borderRadius: 1,
                    p: 0,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white' 
                  }}>
                    <Select
                      value={selectedYAxis}
                      onChange={(e) => setSelectedYAxis(e.target.value)}
                      displayEmpty
                      fullWidth
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
                            color: theme.palette.text.primary,
                          }
                        }
                      }}
                      sx={{
                        height: '56px',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'transparent',
                        },
                        '& .MuiSelect-icon': {
                          color: theme.palette.text.secondary,
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select Y-Axis Column
                      </MenuItem>
                      {analysis?.columns.map((column) => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2,
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <Button
            variant="outlined"
            onClick={() => {
              setAxisSelectionOpen(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedXAxis || !selectedYAxis || loading}
            onClick={handleGenerateCharts}
          >
            Generate Charts
          </Button>
        </Box>
      </Dialog>

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
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, px: 3 }}>
          <Typography variant="h5">
            {currentVisualization?.name || 'View Visualization'}
          </Typography>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {currentVisualization && (
            <Box>
              <Box sx={{ height: 400, p: 3 }}>
                <canvas ref={chartContainerRef} style={{ width: '100%', height: '100%' }}></canvas>
              </Box>
              
              <Box sx={{ 
                p: 3, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' 
              }}>
                <Typography variant="h6" gutterBottom>Data Insights</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {currentVisualization.description || 'This visualization shows key patterns in your data. The chart type was selected based on your data structure and optimal visualization methods.'}
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label={`${currentVisualization.chartType.charAt(0).toUpperCase() + currentVisualization.chartType.slice(1)} Chart`}
                    color="primary"
                    icon={getVisualizationIcon(currentVisualization.chartType)}
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`${currentVisualization.confidence || 90}% confidence`}
                    color="success"
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />}
                    onClick={() => {
                      handleCloseViewDialog();
                      handleEditVisualization(currentVisualization);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      handleCloseViewDialog();
                      handleDeleteVisualization(currentVisualization._id);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Visualization Dialog - simplified */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Edit Visualization
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          {currentVisualization && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Visualization Name</Typography>
                <input
                  type="text"
                  name="name"
                  value={currentVisualization.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter a descriptive name"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : 'white',
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Description</Typography>
                <textarea
                  name="description"
                  value={currentVisualization.description || ''}
                  onChange={handleInputChange}
                  placeholder="Describe what insights this visualization provides"
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : 'white',
                    color: theme.palette.mode === 'dark' ? 'white' : 'black',
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Chart Type</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {['bar', 'line', 'pie', 'scatter'].map(type => (
                    <Box 
                      key={type}
                      onClick={() => setCurrentVisualization({
                        ...currentVisualization,
                        chartType: type
                      })}
                      sx={{ 
                        border: '2px solid',
                        borderColor: currentVisualization.chartType === type ? 'primary.main' : '#ddd',
                        borderRadius: 2,
                        p: 2,
                        width: '110px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        bgcolor: currentVisualization.chartType === type 
                          ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)') 
                          : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent')
                      }}
                    >
                      {type === 'bar' && <ChartIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />}
                      {type === 'line' && <LineIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />}
                      {type === 'pie' && <PieIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />}
                      {type === 'scatter' && <ScatterIcon sx={{ fontSize: 32, mb: 1, color: 'primary.main' }} />}
                      <Typography variant="body2">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseEditDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateVisualization}
            startIcon={<EditIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
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
            This visualization will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCancelDelete} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Visualizations; 