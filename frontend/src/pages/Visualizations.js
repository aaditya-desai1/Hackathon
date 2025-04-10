import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDataContext } from '../App';
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
import { Chart, registerables } from 'chart.js/auto';
import { fetchApi } from '../services/api';

// Register all chart components
Chart.register(...registerables);

function Visualizations() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshData } = useDataContext();
  const theme = useTheme();
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

  const fetchFiles = async (retryCount = 0) => {
    try {
      setFileNotFound(false);
      setError(null);
      
      console.log('[Visualizations] Fetching files, attempt', retryCount + 1);
      
      // Network status check
      if (navigator.onLine === false) {
        console.error('[Visualizations] Browser is offline');
        setError('Network connection unavailable');
        return;
      }
      
      const response = await fetchApi('/api/files');
      const data = await response.json();
      console.log('[Visualizations] Files fetched:', data);
      
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files || []);
        if (data.files.length === 0) {
          console.log('[Visualizations] No files found in response');
        }
      } else {
        console.warn('[Visualizations] Files data format unexpected:', data);
        setFiles([]);
      }
    } catch (error) {
      console.error('[Visualizations] Error fetching files:', error);
      
      // Retry logic - attempt up to 3 retries with increasing delay
      if (retryCount < 3) {
        console.log(`[Visualizations] Retrying fetch files (${retryCount + 1}/3) in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => fetchFiles(retryCount + 1), (retryCount + 1) * 1000);
        return;
      }
      
      setError('Failed to fetch files');
      setFileNotFound(true);
    }
  };

  const fetchVisualizations = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/api/visualizations');
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
      const response = await fetchApi(`/api/files/${file._id}/analyze`);
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
    if (previewFile) {
      // If we already have a selected file from AI recommendations, use it
      setSelectedFile(previewFile);
      // Skip file selection dialog and directly open axis selection
      setAxisSelectionOpen(true);
      
      // Make sure analysis data is available - we need to fetch it if it's missing
      if (!analysis || !analysis.columns || analysis.columns.length === 0) {
        console.log('Analysis data not available, fetching it now...');
        setLoading(true);
        
        // Fetch analysis data for the file
        fetch(`/api/files/${previewFile._id}/analyze`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to analyze file');
            }
            return response.json();
          })
          .then(analysisData => {
            console.log('Analysis fetched:', analysisData);
            
            if (analysisData.success && analysisData.analysis) {
              // Extract column types from analysis
              const columnTypes = {};
              Object.keys(analysisData.analysis.basicAnalysis || {}).forEach(column => {
                columnTypes[column] = analysisData.analysis.basicAnalysis[column].type;
              });
              
              // Set the analysis data
              setAnalysis({
                rowCount: analysisData.analysis.summary?.totalRows || 0,
                columns: Object.keys(analysisData.analysis.basicAnalysis || {}),
                columnTypes: columnTypes,
                visualizationSuggestions: []
              });
              
              setError(null);
            } else {
              throw new Error('Invalid analysis data');
            }
          })
          .catch(err => {
            console.error('Error fetching analysis:', err);
            setError('Failed to analyze file. Please try again.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      // If no file is selected yet, show the file selection dialog
      setOpenDialog(true);
      setSelectedXAxis('');
      setSelectedYAxis('');
      setAxisSelectionOpen(false);
    }
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
        try {
          console.log('Destroying existing chart instance');
          instance.destroy();
        } catch (err) {
          console.error('Error destroying chart:', err);
        }
      }
    });
    
    // Clear the instances state
    setChartPreviewInstances({});
    
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
      }, 1000); // Increased timeout to ensure DOM is ready
    });
    
    // Update state after all chart instances are created
    setTimeout(() => {
      setChartPreviewInstances(newInstances);
    }, 1500);
  };
  
  // Modified createChartInstance function to include fileId validation
  const createChartInstance = async (chartKey, chart, instancesObject) => {
    try {
      console.log(`Creating chart instance for ${chartKey}:`, chart);
      
      // Validate chart data
      if (!chart || !chart.fileId) {
        console.error('Missing required chart data:', { chart });
        return;
      }
      
      if (!chart.xAxis || !chart.yAxis) {
        console.error('Missing axis configuration:', { xAxis: chart.xAxis, yAxis: chart.yAxis });
        return;
      }
      
      // Attempt to get canvas element with a more resilient approach
      const canvasElement = getCanvasElement(chartKey);
      
      if (!canvasElement) {
        console.error(`Could not find canvas element for chart ${chartKey}`);
        
        // Try to find any canvas elements on the page for debugging
        const allCanvases = document.querySelectorAll('canvas');
        console.log(`Found ${allCanvases.length} canvas elements on the page:`, 
          Array.from(allCanvases).map(c => c.id || 'unnamed'));
        return;
      }
      
      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        console.error(`Could not get 2D context for canvas ${chartKey}`);
        return;
      }
      
      // Create fallback visualization with static data
      console.log('Creating fallback visualization with static data for demo');
      createFallbackChart(ctx, chart.chartType, chart.xAxis, chart.yAxis, 
        ['rgba(53, 162, 235, 0.8)'], ['rgba(53, 162, 235, 1)'], 
        instancesObject, chartKey);
      
      // Try fetching actual data in the background after rendering the fallback
      setTimeout(() => {
        fetchChartData(chart, ctx, instancesObject, chartKey);
      }, 1000);
    } catch (error) {
      console.error(`Error creating chart ${chartKey}:`, error);
    }
  };

  // Separated fetch logic to a standalone function 
  const fetchChartData = async (chart, ctx, instancesObject, chartKey) => {
    try {
      // Use the data API to get actual values from the file
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const dataUrl = `${API_BASE_URL}/api/data/chart?fileId=${chart.fileId}&xAxis=${chart.xAxis}&yAxis=${chart.yAxis}`;
      
      console.log(`Fetching chart data from: ${dataUrl}`);
      
      const dataResponse = await fetch(dataUrl);
      console.log(`Data response status: ${dataResponse.status} ${dataResponse.statusText}`);
      
      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error(`Failed to fetch chart data: ${dataResponse.status} ${dataResponse.statusText}`);
        console.error(`Error response: ${errorText}`);
        // Don't throw, we're already showing a fallback chart
        return;
      }
      
      const dataResult = await dataResponse.json();
      
      if (!dataResult.success) {
        console.error('Data fetch was not successful:', dataResult.message);
        return;
      }
      
      console.log('Chart data received, updating chart');
      
      if (instancesObject[chartKey]) {
        instancesObject[chartKey].destroy();
      }
      
      updateChartWithRealData(ctx, chart.chartType, dataResult.chartData.labels, 
        dataResult.chartData.values, chart.yAxis, instancesObject, chartKey);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Create a chart with real data
  const updateChartWithRealData = (ctx, chartType, labels, values, yAxisLabel, instancesObject, chartKey) => {
    console.log('Updating chart with real data:', { chartType, labels, values });
    
      const modernColors = [
      'rgba(53, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(153, 102, 255, 0.8)'
      ];
      
      const modernBorderColors = [
      'rgba(53, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(153, 102, 255, 1)'
    ];
    
    // Create chart data based on the chart type
    let chartData;
    
    if (chartType === 'scatter') {
      // Create scatter plot data points
        const scatterData = [];
      for (let i = 0; i < Math.min(labels.length, values.length); i++) {
        const xValue = isNaN(parseFloat(labels[i])) ? i + 1 : parseFloat(labels[i]);
          scatterData.push({
          x: xValue,
          y: values[i]
          });
        }
        
        chartData = {
          datasets: [{
          label: yAxisLabel || 'Value',
            data: scatterData,
            backgroundColor: modernColors[0],
            borderColor: modernBorderColors[0],
            pointRadius: 7,
          pointHoverRadius: 9,
          pointBackgroundColor: '#ffffff',
          pointBorderWidth: 2
          }]
        };
    } else if (chartType === 'pie') {
        // Pie chart data
        chartData = {
        labels: labels,
          datasets: [{
          data: values,
            backgroundColor: modernColors,
            borderColor: modernBorderColors,
            borderWidth: 1,
            hoverOffset: 12,
            borderRadius: 4
          }]
        };
    } else if (chartType === 'line') {
        // Line chart data
        chartData = {
        labels: labels,
          datasets: [{
          label: yAxisLabel || 'Value',
          data: values,
            fill: {
              target: 'origin',
              above: modernColors[0].replace('0.8', '0.1')
            },
            backgroundColor: modernColors[0],
            borderColor: modernBorderColors[0],
            tension: 0.3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: modernBorderColors[0],
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        };
      } else {
        // Bar chart (default)
        chartData = {
        labels: labels,
          datasets: [{
          label: yAxisLabel || 'Value',
          data: values,
            backgroundColor: modernColors,
            borderColor: modernBorderColors,
            borderWidth: 1,
            borderRadius: 6,
            hoverBackgroundColor: modernColors.map(color => color.replace('0.8', '0.9')),
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }]
        };
      }
    
    // Modern chart options
    const modernChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType === 'pie',
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          padding: 12,
          titleColor: '#ffffff',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 6,
          boxPadding: 6
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: chartType !== 'pie' && chartType !== 'scatter' ? {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [4, 4]
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      } : {}
    };
      
      // Create the chart based on the type
    try {
      console.log('Creating new chart with real data of type:', chartType);
      const newChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: modernChartOptions
      });
      
      console.log('Chart created successfully with real data');
      
      // Store the instance
      if (instancesObject) {
      instancesObject[chartKey] = newChart;
      }
    } catch (chartError) {
      console.error('Error creating chart with real data:', chartError);
    }
  };

  // Attempt to get canvas element with a more resilient approach
  const getCanvasElement = (chartKey) => {
    const canvasId = `chart-${chartKey}`;
    const directCanvas = document.getElementById(canvasId);
    
    if (directCanvas) {
      console.log(`Found canvas element with ID ${canvasId} directly`);
      return directCanvas;
    }
    
    // Try alternative selector approaches
    const canvasByQuery = document.querySelector(`#${canvasId}`);
    if (canvasByQuery) {
      console.log(`Found canvas element with query selector #${canvasId}`);
      return canvasByQuery;
    }
    
    // Look for canvas by partial ID match
    const allCanvases = document.querySelectorAll('canvas');
    for (let canvas of allCanvases) {
      if (canvas.id && canvas.id.includes(chartKey)) {
        console.log(`Found canvas with partial ID match: ${canvas.id}`);
        return canvas;
      }
    }
    
    console.error(`Could not find canvas element with ID ${canvasId} using any method`);
    return null;
  };

  const handleSaveChart = async (chart) => {
    try {
      setLoading(true);
      console.log('Saving chart to database:', chart);
      
      // Validate required fields are present
      if (!chart.name || !chart.fileId || !chart.chartType || !chart.xAxis || !chart.yAxis) {
        throw new Error('Missing required fields for visualization');
      }
      
      // Prepare the config object with proper structure
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
          description: chart.description || `${chart.chartType} chart showing ${chart.yAxis} by ${chart.xAxis}`,
          fileId: chart.fileId,
          chartType: chart.chartType,
          confidence: chart.confidence || 90,
          config: config
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create visualization:', errorData);
        throw new Error(errorData.message || `Failed to create visualization: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Visualization created successfully:', result);
      
      // Show success message
      alert('Visualization saved successfully!');
      
      // Update the DataContext to trigger a refresh across components
      if (refreshData) {
        console.log('Triggering global data refresh');
        refreshData();
      }
      
      // Refresh visualizations list
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
    try {
      console.log('Rendering visualization:', visualization);
      
      if (!visualization) {
        console.error('Invalid visualization object');
        return;
      }
      
      // Get the canvas element
      const canvas = document.getElementById(`visualization-chart-${visualization._id}`);
      if (!canvas) {
        console.error('Canvas element not found for visualization', visualization._id);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for visualization canvas', visualization._id);
        return;
      }

      // Check if there's an existing chart instance and destroy it
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      // Modern color palette
      const modernColors = [
        'rgba(53, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ];
      
      const modernBorderColors = [
        'rgba(53, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(153, 102, 255, 1)'
      ];
      
      const chartType = visualization.chartType || 'bar';
      const xAxis = visualization.xAxis || visualization.config?.xAxis?.field || '';
      const yAxis = visualization.yAxis || visualization.config?.yAxis?.field || '';
      
      // Prepare for data fetching
      let data;
      
      // Fetch actual chart data from the API
      (async () => {
        try {
          const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
          const fileId = visualization.fileId;
          
          // Use the data API to get actual values from the file
          const dataUrl = `${API_BASE_URL}/api/data/chart?fileId=${fileId}&xAxis=${xAxis}&yAxis=${yAxis}`;
          console.log('Fetching chart data from:', dataUrl);
          
          const dataResponse = await fetch(dataUrl);
          
          if (!dataResponse.ok) {
            throw new Error(`Failed to fetch chart data: ${dataResponse.status} ${dataResponse.statusText}`);
          }
          
          const dataResult = await dataResponse.json();
          
          if (!dataResult.success) {
            throw new Error(dataResult.message || 'Failed to get chart data');
          }
          
          console.log('Received actual data for visualization:', dataResult);
          
          const xAxisLabels = dataResult.chartData.labels;
          const yAxisData = dataResult.chartData.values;
          
          // Create chart data based on the chart type
          if (chartType === 'scatter') {
            // Create scatter plot data points
            const scatterData = [];
            for (let i = 0; i < Math.min(xAxisLabels.length, yAxisData.length); i++) {
              // For scatter, we convert label to numeric value if needed
              const xValue = isNaN(parseFloat(xAxisLabels[i])) ? i + 1 : parseFloat(xAxisLabels[i]);
              scatterData.push({
                x: xValue,
                y: yAxisData[i]
              });
            }
            
            data = {
              datasets: [{
                label: yAxis || 'Value',
                data: scatterData,
                backgroundColor: modernColors[0],
                borderColor: modernBorderColors[0],
                pointRadius: 7,
                pointHoverRadius: 9,
                pointBackgroundColor: '#ffffff',
                pointBorderWidth: 2
              }]
            };
          } else if (chartType === 'pie') {
            // For pie charts
            data = {
              labels: xAxisLabels,
              datasets: [{
                label: yAxis || 'Value',
                data: yAxisData,
                backgroundColor: modernColors,
                borderColor: modernBorderColors,
                borderWidth: 1,
                hoverOffset: 12,
                borderRadius: 4
              }]
            };
          } else if (chartType === 'line') {
            // For line charts
            data = {
              labels: xAxisLabels,
              datasets: [{
                label: yAxis || 'Value',
                data: yAxisData,
                fill: {
                  target: 'origin',
                  above: modernColors[0].replace('0.8', '0.1')
                },
                backgroundColor: modernColors[0],
                borderColor: modernBorderColors[0],
                tension: 0.3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: modernBorderColors[0],
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }]
            };
          } else {
            // For bar charts (default)
            data = {
              labels: xAxisLabels,
              datasets: [{
                label: yAxis || 'Value',
                data: yAxisData,
                backgroundColor: modernColors,
                borderColor: modernBorderColors,
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: modernColors.map(color => color.replace('0.8', '0.9')),
                barPercentage: 0.7,
                categoryPercentage: 0.8
              }]
            };
          }
        
          // Chart options
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
                display: chartType === 'pie',
                position: 'top',
            labels: {
              usePointStyle: true,
                  padding: 20,
              font: {
                    size: 12
                  }
                }
              },
          tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
            padding: 12,
                titleColor: '#ffffff',
            titleFont: {
                  size: 14,
                  weight: 'bold'
            },
            bodyFont: {
                  size: 13
                },
                cornerRadius: 6,
                boxPadding: 6
              }
            },
            animation: {
              duration: 1000,
              easing: 'easeOutQuart'
            },
            scales: chartType !== 'pie' && chartType !== 'scatter' ? {
              x: {
                grid: {
                  display: false
            },
            ticks: {
              font: {
                    size: 12
                  },
                  maxRotation: 45,
                  minRotation: 0
            }
          },
          y: {
                beginAtZero: true,
                grid: {
                  borderDash: [4, 4]
            },
            ticks: {
              font: {
                    size: 12
                  }
                }
              }
            } : {}
          };
          
          // Create the chart based on the type
          console.log('Creating new visualization chart of type:', chartType);
          const newChart = new Chart(ctx, {
            type: chartType,
            data: data,
            options: options
          });
          
          console.log('Visualization chart created successfully');
          setChartInstance(newChart);
          
        } catch (dataError) {
          console.error('Error fetching or rendering chart data:', dataError);
          
          // Fallback to placeholder data
          createFallbackChart(ctx, chartType, xAxis, yAxis, modernColors, modernBorderColors);
        }
      })();
    } catch (error) {
      console.error('Error rendering visualization:', error);
    }
  };
  
  // Create a fallback chart with demo data
  const createFallbackChart = (ctx, chartType, xAxis, yAxis, modernColors, modernBorderColors, instancesObject, chartKey) => {
    console.log('Creating fallback chart with demo data:', { chartType, xAxis, yAxis });
    
    // Generate demo data based on chart type and axis names
      let xAxisLabels = [];
    let yAxisData = [];
    
    // Stock symbols and date labels for demo data
    let stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'];
    let dateLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    
    // Map specific column names to appropriate data
    const isStockData = xAxis === 'stock_symbol' || xAxis.includes('stock');
    const isTimeSeriesData = xAxis.includes('date') || xAxis.includes('month') || xAxis.includes('time');
      
      // Generate appropriate X-axis labels based on column name
      if (isStockData && xAxis === 'stock_symbol') {
      xAxisLabels = stockSymbols;
      } else if (isTimeSeriesData) {
        xAxisLabels = dateLabels;
    } else if (xAxis.includes('page') || xAxis.includes('id')) {
      xAxisLabels = ['page_id_1', 'page_id_2', 'page_id_3', 'page_id_4', 'page_id_5'];
      } else if (xAxis.includes('category') || xAxis.includes('type')) {
        xAxisLabels = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
      } else if (xAxis.includes('region') || xAxis.includes('location')) {
        xAxisLabels = ['North', 'South', 'East', 'West', 'Central'];
      } else {
        xAxisLabels = [`${xAxis} 1`, `${xAxis} 2`, `${xAxis} 3`, `${xAxis} 4`, `${xAxis} 5`];
      }
      
      // Generate appropriate Y-axis data based on column name
    if (yAxis.includes('load_time') || yAxis.includes('seconds')) {
      yAxisData = [0.45, 0.62, 0.53, 0.48, 0.71];
    } else if (yAxis.includes('volume') || yAxis.includes('amount')) {
      yAxisData = [12543, 8754, 15876, 9432, 7654];
      } else if (yAxis.includes('price') || yAxis.includes('cost')) {
      yAxisData = [154.23, 187.56, 143.89, 172.45, 168.33];
      } else if (yAxis.includes('percent') || yAxis.includes('rate')) {
      yAxisData = [4.5, 3.2, 5.7, 2.8, 6.1];
      } else {
      yAxisData = [65, 59, 80, 81, 56];
      }
      
    let chartData;
      
      if (chartType === 'scatter') {
      // For scatter charts, create paired x-y coordinates
        const scatterData = [];
        for (let i = 0; i < Math.min(xAxisLabels.length, yAxisData.length); i++) {
          scatterData.push({
            x: (i + 1) * 10,
            y: yAxisData[i]
          });
        }
        
      chartData = {
          datasets: [{
            label: yAxis || 'Value',
            data: scatterData,
            backgroundColor: modernColors[0],
            borderColor: modernBorderColors[0],
            pointRadius: 7,
          pointHoverRadius: 9
          }]
        };
      } else if (chartType === 'pie') {
        // For pie charts
      chartData = {
          labels: xAxisLabels,
          datasets: [{
            data: yAxisData,
            backgroundColor: modernColors,
            borderColor: modernBorderColors,
            borderWidth: 1,
            hoverOffset: 12,
            borderRadius: 4
          }]
        };
      } else if (chartType === 'line') {
        // For line charts
      chartData = {
        labels: xAxisLabels,
          datasets: [{
            label: yAxis || 'Value',
            data: yAxisData,
            fill: {
              target: 'origin',
              above: modernColors[0].replace('0.8', '0.1')
            },
            backgroundColor: modernColors[0],
            borderColor: modernBorderColors[0],
            tension: 0.3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: modernBorderColors[0],
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        };
      } else {
        // For bar charts (default)
      chartData = {
          labels: xAxisLabels,
          datasets: [{
            label: yAxis || 'Value',
            data: yAxisData,
            backgroundColor: modernColors,
            borderColor: modernBorderColors,
            borderWidth: 1,
            borderRadius: 6,
            hoverBackgroundColor: modernColors.map(color => color.replace('0.8', '0.9')),
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }]
        };
      }
      
    // Chart options
    const modernChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType === 'pie',
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          padding: 12,
          titleColor: '#ffffff',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 6,
          boxPadding: 6
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: chartType !== 'pie' && chartType !== 'scatter' ? {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [4, 4]
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      } : {}
    };
    
    // Create the demo chart
    try {
      console.log('Creating fallback chart of type:', chartType);
      
      // If there's an existing chart, destroy it first
      if (instancesObject && instancesObject[chartKey]) {
        instancesObject[chartKey].destroy();
      }
      
      const newChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: modernChartOptions
      });
      
      console.log('Fallback chart created successfully');
      
      // Store the chart instance
      if (instancesObject) {
        instancesObject[chartKey] = newChart;
      }
    } catch (error) {
      console.error('Error creating fallback chart:', error);
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

  // Add this useEffect to store analysis data in localStorage
  useEffect(() => {
    // Store analysis data in localStorage when it's available
    if (analysis && analysis.columns && analysis.columns.length > 0 && previewFile) {
      const analysisCache = {
        fileId: previewFile._id,
        analysis: analysis
      };
      localStorage.setItem('analysisCache', JSON.stringify(analysisCache));
    }
  }, [analysis, previewFile]);
  
  // Add this useEffect to restore analysis data when a file is selected
  useEffect(() => {
    if (selectedFile && (!analysis || !analysis.columns || analysis.columns.length === 0)) {
      // Try to restore from cache first
      const cachedAnalysis = localStorage.getItem('analysisCache');
      
      if (cachedAnalysis) {
        try {
          const parsed = JSON.parse(cachedAnalysis);
          if (parsed.fileId === selectedFile._id) {
            console.log('Restoring analysis from cache for file:', selectedFile.name);
            setAnalysis(parsed.analysis);
            return;
          }
        } catch (err) {
          console.error('Error parsing cached analysis:', err);
        }
      }
      
      // If cache doesn't exist or doesn't match, fetch new analysis
      console.log('No cached analysis found, will fetch on demand');
    }
  }, [selectedFile, analysis]);

  // Add fallback columns when analysis is not available yet
  const getDefaultColumns = () => {
    // Common column names for datasets that might be useful as fallbacks
    return [
      'stock_symbol',
      'trading_volume',
      'price',
      'market_cap',
      'date',
      'percent_change',
      'category',
      'region'
    ];
  };

  const getFallbackColumns = () => {
    if (analysis && analysis.columns && analysis.columns.length > 0) {
      return analysis.columns;
    }
    return getDefaultColumns();
  };

  // Add this after No visualizations yet
  const testApiConnection = async () => {
    try {
      setError(null);
      console.log('[Visualizations] Testing API connection...');
      const response = await fetchApi('/api/test');
      const data = await response.json();
      console.log('[Visualizations] API test result:', data);
      alert(`API Connection Test: ${data.success ? 'SUCCESS' : 'FAILED'}\nMongo: ${data.mongo_connection === 1 ? 'Connected' : 'Disconnected'}\nEnv: ${data.environment}`);
    } catch (error) {
      console.error('[Visualizations] API test failed:', error);
      setError(`API test failed: ${error.message}`);
      alert(`API Connection Test FAILED: ${error.message}`);
    }
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
                  onClick={() => {
                    handleClearVisualizations();
                    // After clearing, open the file selection dialog
                    setOpenDialog(true);
                    setSelectedXAxis('');
                    setSelectedYAxis('');
                    setAxisSelectionOpen(false);
                  }}
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
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={testApiConnection}
              >
                Test Connection
              </Button>
            }
          >
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
                  if (previewFile) {
                    // If we already have a file selected, skip file selection and go straight to axis selection
                    setSelectedFile(previewFile);
                    setAxisSelectionOpen(true);
                  } else {
                    // Otherwise show file selection first
                    setOpenDialog(true);
                    setAxisSelectionOpen(true);
                  }
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
            Custom Chart - Select Columns
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Analyzing file and identifying columns...
              </Typography>
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
                    {analysis?.rowCount || 0} rows analyzed across {analysis?.columns?.length || 0} columns
                  </Typography>
                </Box>
                {analysis && analysis.columns && analysis.columns.length > 0 ? (
                  <Chip 
                    label="Ready for visualization" 
                    color="success" 
                    icon={<CheckCircleIcon />} 
                    sx={{ fontWeight: 'medium' }}
                  />
                ) : (
                  <Chip 
                    label="Waiting for analysis" 
                    color="warning" 
                    sx={{ fontWeight: 'medium' }}
                  />
                )}
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
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
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
                        {loading ? 'Loading columns...' : 'Select X-Axis Column'}
                      </MenuItem>
                      {getFallbackColumns().map((column) => (
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
                      disabled={loading}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
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
                        {loading ? 'Loading columns...' : 'Select Y-Axis Column'}
                      </MenuItem>
                      {getFallbackColumns().map((column) => (
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