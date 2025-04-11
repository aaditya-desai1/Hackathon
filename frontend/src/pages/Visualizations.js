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
  FilterList as FilterListIcon,
  FindInPage as FileSearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CompareArrows as CompareArrowsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
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
  const [selectedChartType, setSelectedChartType] = useState('bar');
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
    
    // Handle case when navigating from file manager with a fileId
    if (location.state?.fileId) {
      console.log('File ID detected in location state:', location.state.fileId);
      
      // Set a flag to process the file after files are loaded
      const fileIdToSelect = location.state.fileId;
      window.history.replaceState({}, document.title);
      
      // Find and select the file once files are loaded
      const selectFileWhenLoaded = async () => {
        try {
          console.log('Fetching specific file with ID:', fileIdToSelect);
          const response = await fetchApi(`/api/files/${fileIdToSelect}`);
          
          if (!response.ok) {
            console.error('Failed to fetch file details:', response.status);
            return;
          }
          
          const data = await response.json();
          console.log('Received file data:', data);
          
          if (data.success && data.file) {
            // Select the file and open the dialog
            handleFileSelect(data.file);
            setOpenDialog(true);
          } else {
            console.error('File not found or invalid response:', data);
          }
        } catch (error) {
          console.error('Error selecting file by ID:', error);
        }
      };
      
      selectFileWhenLoaded();
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
    
    console.log('Generating AI recommended charts for file:', file.name);
    console.log('Analysis data:', analysisData);
    
    // Fetch the AI recommendations from the backend
    fetch(`/api/visualizations/recommend/${file._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get AI recommendations');
        }
        return response.json();
      })
      .then(recommendationData => {
        console.log('AI recommendations received:', recommendationData);
        
        if (recommendationData.success && recommendationData.chartRecommendations) {
          // Use the AI recommended chart types with confidence scores
          const recommendations = recommendationData.chartRecommendations.map(rec => ({
            chartType: rec.chartType,
            confidence: rec.confidence,
            reason: rec.reason,
            columns: rec.columns || []
          }));
          
          // Create preview charts from recommendations
          recommendations.forEach(recommendation => {
            // Get the x and y axis from the recommendation
            let xAxis, yAxis;
            
            if (recommendation.columns && recommendation.columns.length >= 2) {
              // For most chart types, first column is x-axis, second is y-axis
              xAxis = recommendation.columns[0];
              yAxis = recommendation.columns[1];
            } else if (recommendation.columns && recommendation.columns.length === 1) {
              // For pie charts with single column
              xAxis = recommendation.columns[0];
              yAxis = 'count'; // Use count as the metric
            } else {
              // Fallback to recommended axes from analysis
              xAxis = recommendedAxes[recommendation.chartType]?.x;
              yAxis = recommendedAxes[recommendation.chartType]?.y;
            }
            
            if (xAxis && yAxis) {
              previewData.push({
                chartType: recommendation.chartType,
                name: `${file.name} - ${recommendation.chartType.charAt(0).toUpperCase() + recommendation.chartType.slice(1)} Chart`,
                description: `AI Recommended: ${recommendation.reason}`,
                fileId: file._id,
                confidence: recommendation.confidence,
                xAxis: xAxis,
                yAxis: yAxis,
                file: file,
                isAIRecommended: true
              });
            }
          });
          
          // Sort preview data by confidence (highest first)
          previewData.sort((a, b) => b.confidence - a.confidence);
          
          setPreviewFile(file);
          setPreviewCharts(previewData);
          
          // Schedule rendering after the DOM updates
          setTimeout(() => {
            renderPreviewCharts(previewData);
          }, 300);
        } else {
          console.error('Invalid recommendation data received');
          // Fall back to basic recommendations
          fallbackToBasicRecommendations(file, recommendedAxes, analysisData);
        }
      })
      .catch(error => {
        console.error('Error getting AI recommendations:', error);
        // Fall back to basic recommendations
        fallbackToBasicRecommendations(file, recommendedAxes, analysisData);
      });
    
    // Close the file selection dialog
    setOpenDialog(false);
  };

  // Fallback function for when AI recommendations can't be fetched
  const fallbackToBasicRecommendations = (file, recommendedAxes, analysisData) => {
    const previewData = [];
    
    // Check for numeric columns specifically for scatter plots and other charts
    const numericColumns = [];
    if (analysisData && analysisData.basicAnalysis) {
      Object.keys(analysisData.basicAnalysis).forEach(colName => {
        const colData = analysisData.basicAnalysis[colName];
        if (colData.type === 'number' || 
            (colData.sampleValues && colData.sampleValues.some(v => !isNaN(parseFloat(v))))) {
          numericColumns.push({
            name: colName,
            variance: colData.variance || 0,
            uniqueCount: colData.uniqueCount || 0
          });
        }
      });
      // Sort numeric columns by variance (higher first) and uniqueness (higher first)
      numericColumns.sort((a, b) => (b.variance - a.variance) || (b.uniqueCount - a.uniqueCount));
    }
    
    const numericColumnNames = numericColumns.map(col => col.name);
    
    // Check for categorical columns
    const categoricalColumns = [];
    if (analysisData && analysisData.basicAnalysis) {
      Object.keys(analysisData.basicAnalysis).forEach(colName => {
        const colData = analysisData.basicAnalysis[colName];
        const uniqueCount = colData.uniqueCount || 0;
        const uniqueRatio = uniqueCount / (analysisData.summary?.totalRows || 1);
        
        // If unique values < 15 or less than 10% of total rows → likely Categorical
        if ((colData.type === 'string' && (uniqueCount < 15 || uniqueRatio < 0.1))) {
          categoricalColumns.push({
            name: colName,
            uniqueCount: uniqueCount
          });
        }
      });
      // Sort categorical columns by uniqueness (lower is better)
      categoricalColumns.sort((a, b) => a.uniqueCount - b.uniqueCount);
    }
    
    const categoricalColumnNames = categoricalColumns.map(col => col.name);
    
    // Check for date/time columns
    const dateColumns = [];
    const monthColumns = [];
    const monthNamePatterns = [
      /^month$/i,
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
    ];
    
    if (analysisData && analysisData.basicAnalysis) {
      Object.keys(analysisData.basicAnalysis).forEach(colName => {
        const colData = analysisData.basicAnalysis[colName];
        
        // Check if column is a date column
        if (colData.couldBeDate) {
          dateColumns.push(colName);
        }
        
        // Check if column contains month names or is named 'month'
        if (colData.type === 'string' && 
            (colName.toLowerCase() === 'month' || 
             (colData.sampleValues && colData.sampleValues.some(val => 
               monthNamePatterns.some(pattern => pattern.test(String(val))))))) {
          monthColumns.push(colName);
          // Also add to date columns if not already there
          if (!dateColumns.includes(colName)) {
            dateColumns.push(colName);
          }
        }
      });
    }
    
    // Check for sequential numeric ID columns (good for line charts if no dates)
    const sequentialColumns = [];
    numericColumns.forEach(col => {
      // Check if column name contains 'id', 'num', 'seq' or similar keywords
      const isLikelySequential = /id|num|seq|order|index/i.test(col.name);
      if (isLikelySequential && col.uniqueCount > 5) {
        sequentialColumns.push(col.name);
      }
    });
    
    // Initialize confidence scores
    let barChartConfidence = 70;
    let lineChartConfidence = 65;
    let pieChartConfidence = 60;
    let scatterChartConfidence = 55;
    
    // Look for percentage data - which is ideal for pie charts
    let percentageColumn = null;
    let containsPercentageData = false;
    
    // Check for columns with percentage data
    if (analysisData && analysisData.basicAnalysis) {
      // First pass: look for columns with percentage in the name or values with % symbol
      Object.keys(analysisData.basicAnalysis).forEach(colName => {
        const colData = analysisData.basicAnalysis[colName];
        
        // Check column name for percentage indicators
        if (/percent|percentage|distribution|share|ratio|proportion/i.test(colName)) {
          percentageColumn = colName;
          containsPercentageData = true;
        }
        
        // Check string values for % symbol
        if (colData.type === 'string' && colData.mostCommon) {
          const hasPercentSymbol = colData.mostCommon.some(item => 
            String(item.value).includes('%'));
          if (hasPercentSymbol) {
            percentageColumn = colName;
            containsPercentageData = true;
          }
        }
        
        // Check numeric columns with values between 0-100 and percentage in the name
        if (colData.type === 'number' && 
            colData.min >= 0 && colData.max <= 100 && 
            (colName.toLowerCase() === 'percentage' || /percent/i.test(colName))) {
          percentageColumn = colName;
          containsPercentageData = true;
        }
      });
      
      // Special case: check for the exact budget distribution pattern
      // This occurs when there's a column named "Category" and a column with percentage values
      const hasCategory = Object.keys(analysisData.basicAnalysis).some(col => 
        col.toLowerCase() === 'category');
      
      // This is a special case for the monthly_budget_distribution.csv file format
      if (hasCategory && containsPercentageData) {
        pieChartConfidence = 99; // Even higher confidence for this exact pattern
        console.log('Budget distribution pattern detected (Category + Percentage columns) - ideal for pie chart');
      }
      // Second pass: look for a column named "Category" paired with a percentage column
      // This is common in percentage distribution datasets like budget allocations
      else if (containsPercentageData && 
          Object.keys(analysisData.basicAnalysis).some(col => 
            /categor(y|ies)/i.test(col))) {
        // This is very likely to be ideal for a pie chart - significantly boost confidence
        pieChartConfidence = 98;  // Make pie chart the top recommendation
        console.log('Percentage distribution with categories detected - ideal for pie chart');
      } else if (containsPercentageData) {
        // Still boost confidence, but not as much
        pieChartConfidence = 95;
        console.log('Percentage data detected - boosting pie chart confidence');
      }
    }
    
    // [Category vs Number] → Bar Chart
    if (categoricalColumnNames.length > 0 && numericColumnNames.length > 0) {
      // Update confidence based on data characteristics
      if (categoricalColumnNames.length > 10) {
        barChartConfidence = 85;
      } else {
        barChartConfidence = 90;
      }
      
      // If we have month columns, lower the bar chart confidence
      if (monthColumns.length > 0) {
        barChartConfidence = 70; // Lower confidence for bar charts with month data
      }
      
      // Find a good categorical column for the x-axis
      const bestCatColumn = categoricalColumns.find(col => 
        col.uniqueCount >= 3 && col.uniqueCount <= 15)?.name || categoricalColumnNames[0];
      
      // For the y-axis, find a numeric column that's NOT an ID or sequential
      const valueColumns = numericColumnNames.filter(col => !(/id|index|key|code/i.test(col)));
      const valueColumn = valueColumns.length > 0 ? valueColumns[0] : numericColumnNames[0];
      
      previewData.push({
        chartType: 'bar',
        name: `${file.name} - Bar Chart`,
        description: `AI Recommended: ${valueColumn} by ${bestCatColumn}`,
        fileId: file._id,
        confidence: barChartConfidence,
        xAxis: bestCatColumn,
        yAxis: valueColumn,
        file: file,
        isAIRecommended: true
      });
    } else if (numericColumnNames.length > 0) {
      // If no categorical columns, try to make a bar chart with numeric data
      // Look for columns that might represent categories as numbers
      const potentialCategories = numericColumns
        .filter(col => col.uniqueCount <= 20)
        .map(col => col.name);
      
      if (potentialCategories.length > 0) {
        // Use a numeric column with few unique values as categories
        const categoryCol = potentialCategories[0];
        // Find a different column for values
        const valueColumns = numericColumnNames.filter(col => 
          col !== categoryCol && !(/id|index|key|code/i.test(col)));
        const valueCol = valueColumns.length > 0 ? valueColumns[0] : 
          numericColumnNames.find(col => col !== categoryCol) || numericColumnNames[0];
        
        barChartConfidence = 75;
        previewData.push({
          chartType: 'bar',
          name: `${file.name} - Bar Chart`,
          description: `AI Recommended: ${valueCol} by ${categoryCol} categories`,
          fileId: file._id,
          confidence: barChartConfidence,
          xAxis: categoryCol,
          yAxis: valueCol,
          file: file,
          isAIRecommended: true
        });
      } else {
        // Use ID-like column as categories if available
        const idColumns = numericColumnNames.filter(col => /id|index|key|code/i.test(col));
        const nonIdColumns = numericColumnNames.filter(col => !(/id|index|key|code/i.test(col)));
        
        if (idColumns.length > 0 && nonIdColumns.length > 0) {
          barChartConfidence = 70;
          previewData.push({
            chartType: 'bar',
            name: `${file.name} - Bar Chart`,
            description: `AI Recommended: ${nonIdColumns[0]} by ${idColumns[0]}`,
            fileId: file._id,
            confidence: barChartConfidence,
            xAxis: idColumns[0],
            yAxis: nonIdColumns[0],
            file: file,
            isAIRecommended: true
          });
        } else {
          // Default bar chart as last resort
          barChartConfidence = 60;
          previewData.push({
            chartType: 'bar',
            name: `${file.name} - Bar Chart`,
            description: `AI Recommended: Using best available columns for bar chart`,
            fileId: file._id,
            confidence: barChartConfidence,
            xAxis: recommendedAxes.bar.x || numericColumnNames[0],
            yAxis: recommendedAxes.bar.y || (numericColumnNames.length > 1 ? numericColumnNames[1] : numericColumnNames[0]),
            file: file,
            isAIRecommended: true
          });
        }
      }
    } else {
      // No numeric columns at all - use default
      previewData.push({
        chartType: 'bar',
        name: `${file.name} - Bar Chart`,
        description: `AI Recommended: Default bar chart (limited data)`,
        fileId: file._id,
        confidence: barChartConfidence,
        xAxis: recommendedAxes.bar.x,
        yAxis: recommendedAxes.bar.y,
        file: file,
        isAIRecommended: true
      });
    }
    
    // [Time/Sequential vs Number] → Line Chart
    if ((dateColumns.length > 0 || monthColumns.length > 0) && numericColumnNames.length > 0) {
      // If we have date or month columns, use those for line charts
      // Prioritize month columns
      const dateColumn = monthColumns.length > 0 ? monthColumns[0] : dateColumns[0];
      
      // For month data, we want line charts to have higher priority
      lineChartConfidence = monthColumns.length > 0 ? 98 : 95;
      
      previewData.push({
        chartType: 'line',
        name: `${file.name} - Line Chart`,
        description: `AI Recommended: ${numericColumnNames[0]} over time (${dateColumn})`,
          fileId: file._id,
        confidence: lineChartConfidence,
        xAxis: dateColumn,
        yAxis: numericColumnNames[0],
        file: file,
        isAIRecommended: true
      });
    } else if (sequentialColumns.length > 0 && numericColumnNames.length > 0) {
      // If we have sequential columns, use those for line charts
      const sequentialCol = sequentialColumns[0];
      // Choose a different numeric column for the y-axis (not the sequential one)
      const valueCol = numericColumnNames.find(col => col !== sequentialCol) || numericColumnNames[0];
      
      lineChartConfidence = 75;
      previewData.push({
        chartType: 'line',
        name: `${file.name} - Line Chart`,
        description: `AI Recommended: ${valueCol} by sequence (${sequentialCol})`,
        fileId: file._id,
        confidence: lineChartConfidence,
        xAxis: sequentialCol,
        yAxis: valueCol,
        file: file,
        isAIRecommended: true
      });
    } else if (categoricalColumnNames.length > 0 && numericColumnNames.length > 0) {
      // Fallback to categorical for x-axis
      lineChartConfidence = 65;
      previewData.push({
        chartType: 'line',
        name: `${file.name} - Line Chart`,
        description: `AI Recommended: ${numericColumnNames[0]} trends across ${categoricalColumnNames[0]}`,
        fileId: file._id,
        confidence: lineChartConfidence,
        xAxis: categoricalColumnNames[0],
        yAxis: numericColumnNames[0],
        file: file,
        isAIRecommended: true
      });
    } else {
      // Default line chart
      previewData.push({
        chartType: 'line',
        name: `${file.name} - Line Chart`,
        description: `AI Recommended: Default line chart`,
        fileId: file._id,
        confidence: lineChartConfidence,
        xAxis: recommendedAxes.line.x,
        yAxis: recommendedAxes.line.y,
        file: file,
        isAIRecommended: true
      });
    }
    
    // [Two DIFFERENT Numbers] → Scatter Plot
    if (numericColumnNames.length >= 2) {
      // Try to find columns that might have a relationship
      // Avoid using ID columns for y-axis values in scatter plots
      const potentialXColumns = numericColumnNames.filter(col => /id|index|key|code/i.test(col));
      const potentialYColumns = numericColumnNames.filter(col => !/id|index|key|code/i.test(col));
      
      let xAxis, yAxis;
      
      // If we have a column that looks like an ID and a non-ID column, use those
      if (potentialXColumns.length > 0 && potentialYColumns.length > 0) {
        xAxis = potentialXColumns[0];
        yAxis = potentialYColumns[0];
        scatterChartConfidence = 85;
      } else if (numericColumnNames.length >= 2) {
        // Otherwise just use the first two different numeric columns
        xAxis = numericColumnNames[0];
        yAxis = numericColumnNames.find(col => col !== xAxis) || numericColumnNames[1];
        scatterChartConfidence = 75;
      } else {
        // Fallback (though this branch shouldn't execute with the condition above)
        xAxis = numericColumnNames[0];
        yAxis = numericColumnNames[0];
        scatterChartConfidence = 60;
      }
      
      previewData.push({
        chartType: 'scatter',
        name: `${file.name} - Scatter Chart`,
        description: `AI Recommended: Relationship between ${yAxis} and ${xAxis}`,
        fileId: file._id,
        confidence: scatterChartConfidence,
          xAxis: xAxis,
          yAxis: yAxis,
          file: file,
          isAIRecommended: true
        });
    } else {
      // Default scatter chart
      previewData.push({
        chartType: 'scatter',
        name: `${file.name} - Scatter Chart`,
        description: `AI Recommended: Default scatter chart`,
        fileId: file._id,
        confidence: scatterChartConfidence,
        xAxis: recommendedAxes.scatter.x,
        yAxis: recommendedAxes.scatter.y,
        file: file,
        isAIRecommended: true
      });
    }
    
    // [One Categorical with limited values] → Pie Chart
    if (categoricalColumnNames.length > 0 && numericColumnNames.length > 0) {
      // Only recommend pie chart if we have both a categorical column and a numeric value column
      // Find best categorical column for pie chart (ideally with 3-10 categories)
      const bestPieColumn = categoricalColumns.find(col => col.uniqueCount >= 3 && col.uniqueCount <= 10);
      const pieColumn = bestPieColumn ? bestPieColumn.name : categoricalColumnNames[0];
      
      // For pie charts, we need a meaningful value column (not an ID or index)
      const valueColumns = numericColumnNames.filter(col => !(/id|index|key|code/i.test(col)));
      
      if (valueColumns.length > 0) {
        // We have both a good category column and a value column
        const yAxisValue = valueColumns[0];
        const uniqueCount = categoricalColumns.find(col => col.name === pieColumn)?.uniqueCount || 0;
        
        // Adjust confidence based on unique count
        if (uniqueCount >= 3 && uniqueCount <= 7) {
          pieChartConfidence = Math.max(pieChartConfidence, 75);
        } else if (uniqueCount <= 10) {
          pieChartConfidence = Math.max(pieChartConfidence, 65);
        } else if (uniqueCount > 20) {
          // Too many categories for a pie chart
          pieChartConfidence = containsPercentageData ? 80 : 40;
        } else {
          pieChartConfidence = Math.max(pieChartConfidence, 50);
        }
        
        previewData.push({
          chartType: 'pie',
          name: `${file.name} - Pie Chart`,
          description: containsPercentageData 
            ? `AI Recommended: Percentage distribution across categories` 
            : `AI Recommended: Distribution of ${yAxisValue} across ${pieColumn} categories`,
          fileId: file._id,
          confidence: pieChartConfidence,
          xAxis: pieColumn,
          yAxis: yAxisValue,
          file: file,
          isAIRecommended: true,
          config: {
            showAsPercentage: true  // Display values as proportions of the whole
          }
        });
      } else {
        // No good value column for pie chart, drop confidence significantly
        pieChartConfidence = 40;
      }
    } else if (containsPercentageData && categoricalColumnNames.length > 0) {
      // Special case for percentage data with categories but no good numeric columns
      const categoryCol = categoricalColumnNames[0];
      
      previewData.push({
        chartType: 'pie',
        name: `${file.name} - Pie Chart`,
        description: `AI Recommended: Percentage distribution by ${categoryCol}`,
        fileId: file._id,
        confidence: pieChartConfidence,
        xAxis: categoryCol,
        yAxis: percentageColumn || 'Percentage',
        file: file,
        isAIRecommended: true,
        config: {
          showAsPercentage: true
        }
      });
    } else {
      // Don't recommend a pie chart at all - it needs both categorical and numeric data
      pieChartConfidence = 30;
    }
    
    // Sort preview data by confidence (highest first)
    previewData.sort((a, b) => b.confidence - a.confidence);
    
    setPreviewFile(file);
    setPreviewCharts(previewData);
    
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

  // Function to handle creating a custom chart directly from AI recommendations section
  const handleCreateCustomChart = () => {
    if (previewFile) {
      // Open the custom chart dialog (re-using axisSelectionOpen state)
      setSelectedFile(previewFile);
      
      // Reset axis and chart type selections
      setSelectedXAxis('');
      setSelectedYAxis('');
      setSelectedChartType('bar');
      
      // Open the chart creation dialog
      setAxisSelectionOpen(true);
      
      // Make sure analysis data is available
      if (!analysis || !analysis.columns || analysis.columns.length === 0) {
        console.log('Analysis data not available, fetching it for custom chart');
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
            console.log('Analysis fetched for custom chart:', analysisData);
            
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
            console.error('Error fetching analysis for custom chart:', err);
            setError('Failed to analyze file. Please try again.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      // If no file is selected yet, show a message
      setError('Please select a file first');
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
    
    // Create a single custom chart of the selected type
    const previewData = [];
    
    // Get confidence based on chart type
    const confidence = 
      selectedChartType === 'bar' ? 85 : 
      selectedChartType === 'line' ? 75 : 
      selectedChartType === 'pie' ? 65 : 60;
    
    previewData.push({
      chartType: selectedChartType,
      name: `${selectedFile.name} - ${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart`,
      description: `Custom Chart: ${selectedYAxis} by ${selectedXAxis}`,
      fileId: selectedFile._id,
      confidence: confidence,
      xAxis: selectedXAxis,
      yAxis: selectedYAxis,
      file: selectedFile,
      isAIRecommended: false
    });
    
    setPreviewFile(selectedFile);
    setPreviewCharts(prevCharts => {
      // Maintain existing charts
      return [...prevCharts, ...previewData];
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
    
    // Wait a bit longer to ensure DOM is fully ready before attempting to render charts
    setTimeout(() => {
      // Create chart instances for each chart type
      charts.forEach((chart, index) => {
        // Generate a consistent key for each chart
        const chartKey = chart.isAIRecommended ? 
          `ai-${chart.chartType}` : 
          `custom-${chart.chartType}-${chart.xAxis}-${chart.yAxis}`;
        
        console.log(`Setting up chart: ${chartKey}`);
        
        // For debugging, log all canvas elements currently in the refs
        console.log('Current canvas refs:', Object.keys(chartPreviewRefs.current));
        
        // Double-check canvas existence before creating instance
        const canvasElement = getCanvasElement(chartKey);
        
        if (canvasElement) {
          console.log(`Creating chart instance for ${chartKey} with canvas:`, canvasElement);
          createChartInstance(chartKey, chart, newInstances);
        } else {
          console.warn(`Canvas reference not found for ${chartKey}. Attempting direct DOM query...`);
          
          // Try direct DOM query as a fallback
          const allCanvases = document.querySelectorAll('canvas');
          console.log(`Found ${allCanvases.length} total canvases on the page`);
          
          // Try to match any canvas containing parts of our chart key
          const matchingCanvas = Array.from(allCanvases).find(c => 
            c.id && (c.id.includes(chart.chartType) && 
            (chart.isAIRecommended || (c.id.includes(chart.xAxis) || c.id.includes(chart.yAxis)))));
          
          if (matchingCanvas) {
            console.log(`Found matching canvas by DOM search:`, matchingCanvas.id);
            // Store the reference for future use
            chartPreviewRefs.current[chartKey] = matchingCanvas;
            createChartInstance(chartKey, chart, newInstances);
          } else {
            console.error(`Could not find any matching canvas for ${chartKey}`);
          }
        }
      });
      
      // Update state after all chart instances are created
      setChartPreviewInstances(newInstances);
    }, 1500); // Increased timeout to ensure DOM is fully ready
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
      
      // Show loading state on the chart container
      const chartContainer = canvasElement.parentElement;
      if (chartContainer) {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = `loading-${chartKey}`;
        loadingOverlay.style.position = 'absolute';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.width = '100%';
        loadingOverlay.style.height = '100%';
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.justifyContent = 'center';
        loadingOverlay.style.alignItems = 'center';
        loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingOverlay.style.zIndex = '10';
        loadingOverlay.innerHTML = `
          <div style="text-align: center;">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div style="margin-top: 1rem; font-weight: bold;">Loading chart data...</div>
          </div>
        `;
        
        // Make chart container position relative if not already
        if (chartContainer.style.position !== 'relative') {
          chartContainer.style.position = 'relative';
        }
        
        chartContainer.appendChild(loadingOverlay);
      }
      
      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        console.error(`Could not get 2D context for canvas ${chartKey}`);
        return;
      }
      
      // If there's an existing chart instance, destroy it
      if (instancesObject[chartKey]) {
        console.log(`Destroying existing chart for ${chartKey}`);
        instancesObject[chartKey].destroy();
      }
      
      // Skip the placeholder chart and directly fetch the real data
      fetchChartData(chart, ctx, instancesObject, chartKey);
    } catch (error) {
      console.error(`Error creating chart ${chartKey}:`, error);
    }
  };

  // Fetch chart data and render it directly without showing fallback first
  const fetchChartData = async (chart, ctx, instancesObject, chartKey) => {
    try {
      // Check if chart data is valid
      if (!chart || !chart.fileId || !chart.xAxis || !chart.yAxis) {
        console.error('Invalid chart configuration:', chart);
        removeLoadingOverlay(chartKey);
        return;
      }

      // Determine if we're using index as x-axis (special case for scatter plots)
      const useIndexAsXAxis = chart.chartType === 'scatter' && chart.xAxis === 'index';
      
      // Prepare API URL
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      let dataUrl = `${API_BASE_URL}/api/data/chart?fileId=${chart.fileId}&yAxis=${chart.yAxis}`;
      
      if (!useIndexAsXAxis) {
        dataUrl += `&xAxis=${chart.xAxis}`;
      }
      
      console.log(`Fetching chart data from: ${dataUrl}`);
      
      // Set up the axis labels
      const axisLabels = {
        xAxis: useIndexAsXAxis ? 'Index' : chart.xAxis,
        yAxis: chart.yAxis
      };
      
      // Fetch the data
      let chartData = null;
      
      try {
        const response = await fetch(dataUrl);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && 
              result.chartData && 
              result.chartData.values && 
              Array.isArray(result.chartData.values) &&
              result.chartData.values.length > 0) {
            
            // Handle special case for index-based x-axis
            if (useIndexAsXAxis) {
              result.chartData.labels = Array.from(
                { length: result.chartData.values.length }, 
                (_, i) => i + 1
              );
            }
            
            // Ensure we have labels
            if (!result.chartData.labels || !Array.isArray(result.chartData.labels)) {
              result.chartData.labels = Array.from(
                { length: result.chartData.values.length }, 
                (_, i) => `Item ${i+1}`
              );
            }
            
            // Store valid chart data
            chartData = result.chartData;
            
            console.log('Chart data received:', {
              chartType: chart.chartType,
              sampleLabels: chartData.labels.slice(0, 3),
              sampleValues: chartData.values.slice(0, 3),
              count: chartData.values.length
            });
          } else {
            console.error('Invalid data structure or unsuccessful response:', result);
          }
        } else {
          console.error(`API error: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        console.error('Error fetching chart data:', fetchError);
      }
      
      // Destroy any existing chart instance
      if (instancesObject[chartKey]) {
        instancesObject[chartKey].destroy();
        instancesObject[chartKey] = null;
      }
      
      // Render the chart with real data or fallback if needed
      updateChartWithRealData(
        ctx, 
        chart.chartType, 
        chartData ? chartData.labels : null, 
        chartData ? chartData.values : null, 
        axisLabels.yAxis, 
        instancesObject, 
        chartKey, 
        axisLabels.xAxis
      );
      
      // Remove loading overlay
      removeLoadingOverlay(chartKey);
    } catch (error) {
      console.error('Error in chart creation process:', error);
      removeLoadingOverlay(chartKey);
    }
  };
  
  // Helper function to remove loading overlay
  const removeLoadingOverlay = (chartKey) => {
    setTimeout(() => {
      const loadingOverlay = document.getElementById(`loading-${chartKey}`);
      if (loadingOverlay) {
        loadingOverlay.remove();
      }
    }, 300);
  };

  // Create a chart with real data
  const updateChartWithRealData = (ctx, chartType, labels, values, yAxisLabel, instancesObject, chartKey, xAxisLabel) => {
    console.log('Updating chart with real data:', { chartType, labels, values, xAxisLabel, yAxisLabel });
    
    // Generate a wider range of unique colors
    const generateUniqueColors = (count) => {
      // Base colors with good contrast
      const baseColors = [
        [53, 162, 235],   // Blue
        [255, 99, 132],   // Red
        [75, 192, 192],   // Teal
        [255, 159, 64],   // Orange
        [153, 102, 255],  // Purple
        [255, 205, 86],   // Yellow
        [0, 168, 133],    // Emerald
        [54, 162, 92],    // Green
        [255, 99, 71],    // Tomato
        [106, 90, 205]    // Slate Blue
      ];
      
      // If we need more colors than in the base set, generate them algorithmically
      const uniqueColors = [];
      const uniqueBorderColors = [];
      
      for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
          // Use predefined base colors first
          uniqueColors.push(`rgba(${baseColors[i][0]}, ${baseColors[i][1]}, ${baseColors[i][2]}, 0.8)`);
          uniqueBorderColors.push(`rgba(${baseColors[i][0]}, ${baseColors[i][1]}, ${baseColors[i][2]}, 1)`);
        } else {
          // Generate colors using HSL for better distribution
          // This uses the golden ratio to create evenly distributed hues
          const hue = (i * 137.508) % 360; // Golden angle approximation
          const saturation = 75 + (i % 2) * 10; // Alternate between 75% and 85% saturation
          const lightness = 55 + (i % 3) * 5;  // Vary lightness slightly
          
          // Convert HSL to RGB for rgba format
          const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
          const huePrime = hue / 60;
          const x = chroma * (1 - Math.abs(huePrime % 2 - 1));
          
          let r1, g1, b1;
          if (huePrime >= 0 && huePrime < 1) { r1 = chroma; g1 = x; b1 = 0; }
          else if (huePrime >= 1 && huePrime < 2) { r1 = x; g1 = chroma; b1 = 0; }
          else if (huePrime >= 2 && huePrime < 3) { r1 = 0; g1 = chroma; b1 = x; }
          else if (huePrime >= 3 && huePrime < 4) { r1 = 0; g1 = x; b1 = chroma; }
          else if (huePrime >= 4 && huePrime < 5) { r1 = x; g1 = 0; b1 = chroma; }
          else { r1 = chroma; g1 = 0; b1 = x; }
          
          const m = lightness / 100 - chroma / 2;
          const r = Math.round((r1 + m) * 255);
          const g = Math.round((g1 + m) * 255);
          const b = Math.round((b1 + m) * 255);
          
          uniqueColors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
          uniqueBorderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
        }
      }
      
      return { colors: uniqueColors, borderColors: uniqueBorderColors };
    };
    
    // Create chart data based on the chart type
    let chartData;
    
    // Check if we have valid data, if not create fallback data
    const hasValidData = labels && values && labels.length > 0 && values.length > 0;
    
    if (chartType === 'scatter') {
      if (hasValidData) {
        // Create scatter plot data points from real data
        const scatterData = [];
        for (let i = 0; i < Math.min(labels.length, values.length); i++) {
          // Try to convert to numeric values for scatter plot
          let xValue = labels[i];
          if (typeof xValue === 'string') {
            // Try to extract numeric value from string
            const numericValue = parseFloat(xValue.replace(/[^0-9.-]+/g, ''));
            xValue = isNaN(numericValue) ? i + 1 : numericValue;
          }
          
          scatterData.push({
            x: xValue,
            y: values[i]
          });
        }
        
        // Generate unique color for scatter points
        const { colors, borderColors } = generateUniqueColors(1);
        
        chartData = {
          datasets: [{
            label: yAxisLabel || 'Value',
            data: scatterData,
            backgroundColor: colors[0],
            borderColor: borderColors[0],
            pointRadius: 7,
            pointHoverRadius: 9,
            pointBackgroundColor: '#ffffff',
            pointBorderWidth: 2
          }]
        };
      } else {
        // Create fallback scatter data with realistic trading volume example
        const tradingVolumes = [
          { x: 120.5, y: 250000 },
          { x: 145.75, y: 320000 },
          { x: 160.25, y: 180000 },
          { x: 130.5, y: 420000 },
          { x: 155.0, y: 350000 },
          { x: 140.25, y: 280000 },
          { x: 165.75, y: 190000 },
          { x: 175.0, y: 310000 },
          { x: 125.75, y: 270000 },
          { x: 150.5, y: 330000 }
        ];
        
        // Generate unique color for scatter points
        const { colors, borderColors } = generateUniqueColors(1);
        
        chartData = {
          datasets: [{
            label: 'Trading Volume by Price',
            data: tradingVolumes,
            backgroundColor: colors[0],
            borderColor: borderColors[0],
            pointRadius: 7,
            pointHoverRadius: 9,
            pointBackgroundColor: '#ffffff',
            pointBorderWidth: 2
          }]
        };
      }
    } else if (chartType === 'pie') {
        // Pie chart data
        if (hasValidData) {
          // Generate a unique color for each pie segment
          const { colors, borderColors } = generateUniqueColors(labels.length);
          
          chartData = {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 1,
              hoverOffset: 12,
              borderRadius: 4
            }]
          };
        } else {
          // Fallback pie data
          const fallbackLabels = ['Category A', 'Category B', 'Category C', 'Category D'];
          const { colors, borderColors } = generateUniqueColors(fallbackLabels.length);
          
          chartData = {
            labels: fallbackLabels,
            datasets: [{
              data: [40, 25, 20, 15],
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 1,
              hoverOffset: 12,
              borderRadius: 4
            }]
          };
        }
    } else if (chartType === 'line') {
        // Line chart data
        if (hasValidData) {
          // Generate unique color for line
          const { colors, borderColors } = generateUniqueColors(1);
          
          chartData = {
            labels: labels,
            datasets: [{
              label: yAxisLabel || 'Value',
              data: values,
              fill: {
                target: 'origin',
                above: colors[0].replace('0.8', '0.1')
              },
              backgroundColor: colors[0],
              borderColor: borderColors[0],
              tension: 0.3,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: borderColors[0],
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          };
        } else {
          // Fallback line data
          const { colors, borderColors } = generateUniqueColors(1);
          
          chartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Monthly Trend',
              data: [65, 59, 80, 81, 56, 55],
              fill: {
                target: 'origin',
                above: colors[0].replace('0.8', '0.1')
              },
              backgroundColor: colors[0],
              borderColor: borderColors[0],
              tension: 0.3,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: borderColors[0],
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          };
        }
      } else {
        // Bar chart (default)
        if (hasValidData) {
          // Generate a unique color for each bar
          const { colors, borderColors } = generateUniqueColors(values.length);
          
          chartData = {
            labels: labels,
            datasets: [{
              label: yAxisLabel || 'Value',
              data: values,
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: colors.map(color => color.replace('0.8', '0.9')),
              barPercentage: 0.7,
              categoryPercentage: 0.8
            }]
          };
        } else {
          // Fallback bar data
          const fallbackLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
          const { colors, borderColors } = generateUniqueColors(fallbackLabels.length);
          
          chartData = {
            labels: fallbackLabels,
            datasets: [{
              label: 'Quarterly Results',
              data: [420, 368, 520, 489],
              backgroundColor: colors,
              borderColor: borderColors,
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: colors.map(color => color.replace('0.8', '0.9')),
              barPercentage: 0.7,
              categoryPercentage: 0.8
            }]
          };
        }
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
          boxPadding: 6,
          callbacks: chartType === 'pie' ? {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              // Check if the value already has a % symbol
              if (String(value).includes('%')) {
                return `${label}: ${value}`;
              }
              
              // For pie charts, we typically want to show percentages
              // since we don't have reference to 'visualization' here
              return `${label}: ${percentage}%`;
            }
          } : undefined
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: chartType !== 'pie' ? {
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
          },
          title: {
            display: true,
            text: xAxisLabel || 'X-Axis',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: { top: 10, bottom: 0 }
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
          },
          title: {
            display: true,
            text: yAxisLabel || 'Y-Axis',
            font: {
              size: 14, 
              weight: 'bold'
            },
            padding: { top: 0, bottom: 10 }
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
    // Try direct ID match first
    const canvasId = `chart-${chartKey}`;
    let canvas = document.getElementById(canvasId);
    
    if (canvas) {
      console.log(`Found canvas element with ID ${canvasId} directly`);
      return canvas;
    }
    
    // If chartKey is for a custom chart, try additional formats to handle potential ID discrepancies
    if (chartKey.startsWith('custom-')) {
      // Try finding by chart key without the xAxis and yAxis parts
      const parts = chartKey.split('-');
      if (parts.length >= 2) {
        const baseKey = parts.slice(0, 2).join('-'); // 'custom-chartType'
        
        // Try all canvases on the page and look for partial matches
        const allCanvases = document.querySelectorAll('canvas');
        
        for (let canvas of allCanvases) {
          if (canvas.id && canvas.id.includes(baseKey)) {
            console.log(`Found custom chart canvas with partial ID match: ${canvas.id}`);
            return canvas;
          }
        }
      }
    }
    
    // Try alternative selector approaches
    canvas = document.querySelector(`#${canvasId}`);
    if (canvas) {
      console.log(`Found canvas element with query selector #${canvasId}`);
      return canvas;
    }
    
    // Look for any canvas that contains the chartKey
    const allCanvases = document.querySelectorAll('canvas');
    for (let canvas of allCanvases) {
      if (canvas.id && canvas.id.includes(chartKey)) {
        console.log(`Found canvas with partial ID match: ${canvas.id}`);
        return canvas;
      }
    }
    
    // As a last resort, log all canvases found
    console.error(`Could not find canvas element with ID ${canvasId} using any method`);
    console.log('Available canvases:', Array.from(document.querySelectorAll('canvas')).map(c => c.id));
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
        return <BarChartIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'scatter':
        return <ScatterPlotIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'line':
        return <ShowChartIcon sx={{ ...iconSize, ...iconColor }} />;
      case 'pie':
        return <PieChartIcon sx={{ ...iconSize, ...iconColor }} />;
      default:
        return <BarChartIcon sx={{ ...iconSize, ...iconColor }} />;
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
                boxPadding: 6,
                callbacks: chartType === 'pie' ? {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const dataset = context.dataset;
                    const total = dataset.data.reduce((acc, val) => acc + val, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    
                    // Check if the value already has a % symbol
                    if (String(value).includes('%')) {
                      return `${label}: ${value}`;
                    }
                    
                    // For pie charts, we typically want to show percentages
                    // since we don't have reference to 'visualization' here
                    return `${label}: ${percentage}%`;
                  }
                } : undefined
              }
            },
            animation: {
              duration: 1000,
              easing: 'easeOutQuart'
            },
            scales: chartType !== 'pie' ? {
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
          
          // Show error message on canvas
          showErrorMessage(ctx, 'Could not load chart data. Please try again.');
        }
      })();
    } catch (error) {
      console.error('Error rendering visualization:', error);
      showErrorMessage(ctx, 'Error rendering visualization. Please try again.');
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
            
            // Set the file and charts first
            setPreviewFile(parsedFile);
            setPreviewCharts(parsedCharts);
            
            // Check if the file still exists
            try {
              const response = await fetch(`/api/files/${parsedFile._id}`);
              if (!response.ok) {
                // File doesn't exist anymore, but still show visualizations with warning
                console.log('Saved file no longer exists, showing warning');
                setFileNotFound(true);
              } else {
                // File exists, restore visualizations
                console.log('File exists, restoring visualizations');
                setFileNotFound(false);
              }
            } catch (fetchError) {
              console.error('Error checking file existence:', fetchError);
              // Still show charts even if we can't verify file existence
              setFileNotFound(true);
            }
            
            // Wait for the DOM to be ready before rendering charts
            setTimeout(() => {
              console.log('Rendering restored charts...');
              renderPreviewCharts(parsedCharts);
            }, 2000); // Longer timeout for page refresh scenarios
          } catch (error) {
            console.error('Error restoring saved charts:', error);
            // Clear invalid data
            localStorage.removeItem('previewCharts');
            localStorage.removeItem('previewFile');
          }
        }
      }
    };
    
    restoreAndValidateCharts();
  }, []);

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

  const createPlaceholderChart = async (ctx, chartType, instancesObject, chartKey, xAxisLabel, yAxisLabel) => {
    try {
      // Generate unique colors
      const generateUniqueColors = (count) => {
        // Base colors with good contrast
        const baseColors = [
          [53, 162, 235],   // Blue
          [255, 99, 132],   // Red
          [75, 192, 192],   // Teal
          [255, 159, 64],   // Orange
          [153, 102, 255],  // Purple
          [255, 205, 86],   // Yellow
          [0, 168, 133],    // Emerald
          [54, 162, 92],    // Green
          [255, 99, 71],    // Tomato
          [106, 90, 205]    // Slate Blue
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
          // Cycle through the base colors
          const color = baseColors[i % baseColors.length];
          // Add a slight variation for repeated colors
          const variation = Math.floor(i / baseColors.length) * 20;
          const r = Math.max(0, Math.min(255, color[0] - variation));
          const g = Math.max(0, Math.min(255, color[1] - variation));
          const b = Math.max(0, Math.min(255, color[2] - variation));
          
          colors.push(`rgba(${r}, ${g}, ${b}, 0.5)`);
        }
        
        return colors;
      };
      
      let chartData;
      
      if (chartType === 'scatter') {
        // Scatter plot placeholder
        const colors = generateUniqueColors(1);
        
        chartData = {
          datasets: [{
            label: yAxisLabel || 'Loading data...',
            data: [
              { x: 1, y: 0 },
              { x: 2, y: 0 }
            ],
            backgroundColor: colors[0],
            borderColor: colors[0].replace('0.5', '1'),
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        };
      } else if (chartType === 'pie') {
        // Pie chart placeholder
        const pieSegments = ['Loading...', '...', '...'];
        const colors = generateUniqueColors(pieSegments.length);
        
        chartData = {
          labels: pieSegments,
          datasets: [{
            data: [70, 20, 10],
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.5', '1')),
            borderWidth: 1
          }]
        };
      } else if (chartType === 'line') {
        // Line chart placeholder
        const colors = generateUniqueColors(1);
        
        chartData = {
          labels: ['Loading...', '...', '...', '...', '...'],
          datasets: [{
            label: yAxisLabel || 'Loading data...',
            data: [65, 70, 65, 70, 65],
            backgroundColor: colors[0],
            borderColor: colors[0].replace('0.5', '1'),
            tension: 0.4
          }]
        };
      } else {
        // Bar chart placeholder
        const barCount = 4;
        const colors = generateUniqueColors(barCount);
        
        chartData = {
          labels: ['Loading data...', '...', '...', '...'],
          datasets: [{
            label: yAxisLabel || 'Loading data...',
            data: [40, 40, 40, 40],
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.5', '1')),
            borderWidth: 1,
            borderRadius: 4
          }]
        };
      }
      
      // Placeholder chart options with loading indicator
      const placeholderOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType === 'pie',
            position: 'top',
            labels: {
              color: '#64748b',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            enabled: false
          }
        },
        animation: {
          duration: 800,
          easing: 'linear'
        },
        scales: chartType !== 'pie' ? {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: xAxisLabel || 'Loading...',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#64748b',
              padding: { top: 10, bottom: 0 }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(226, 232, 240, 0.5)',
              borderDash: [2]
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: yAxisLabel || 'Loading...',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#64748b',
              padding: { top: 0, bottom: 10 }
            }
          }
        } : {}
      };
      
      console.log(`Creating placeholder chart for ${chartKey}`);
      
      // Create chart
      const placeholderChart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: placeholderOptions
      });
      
      // Store the instance
      if (instancesObject) {
        instancesObject[chartKey] = placeholderChart;
      }
      
      return placeholderChart;
    } catch (error) {
      console.error(`Error creating placeholder chart: ${error}`);
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
            
            {/* Sort the filtered charts by confidence score */}
            <Grid container spacing={3}>
              {previewCharts
                .filter(chart => chart.isAIRecommended)
                .sort((a, b) => b.confidence - a.confidence)
                .map((chart, index) => {
                  // Generate a consistent key for each chart
                  const chartKey = `ai-${chart.chartType}`;
                  
                  return (
                  <Grid item xs={12} sm={6} key={`ai-${chart.chartType}-${index}`}>
                    <Card sx={{ 
                      height: '100%',
                      minHeight: 500,
                      maxHeight: 600,
                      bgcolor: 'background.paper',
                      backgroundImage: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid #1976d2',
                      transform: 'scale(1.02)',
                      transition: 'transform 0.2s ease-in-out',
                      zIndex: 1
                    }}>
                      <Box sx={{ 
                        bgcolor: '#1976d2', 
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
                        {chart.description}
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        height: 300, 
                        position: 'relative', 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <canvas 
                          ref={el => {
                            if (el) chartPreviewRefs.current[chartKey] = el;
                          }}
                          style={{ width: '100%', height: '100%' }}
                          id={`chart-${chartKey}-${index}`}
                          data-chart-type={chart.chartType}
                          data-is-ai="true"
                          data-x-axis={chart.xAxis}
                          data-y-axis={chart.yAxis}
                        />
                      </Box>
                      <Box sx={{ p: 2, mt: 'auto' }}>
                        <Button 
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handleSaveChart(chart)}
                          disabled={fileNotFound}
                          sx={{
                            boxShadow: 2
                          }}
                        >
                          Save Visualization
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                )})}
            </Grid>
            
            {/* Add Create Custom Chart button below AI recommendations */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreateCustomChart}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: 3,
                  fontSize: '1rem'
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
              {previewCharts.filter(chart => !chart.isAIRecommended).map((chart, index) => {
                // Generate a consistent key for each chart
                const chartKey = `custom-${chart.chartType}-${chart.xAxis}-${chart.yAxis}`;
                
                return (
                  <Grid item xs={12} sm={6} key={`custom-${chart.chartType}-${index}`}>
                    <Card sx={{ 
                      height: '100%',
                      minHeight: 500,
                      maxHeight: 600,
                      bgcolor: 'background.paper',
                      backgroundImage: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid #1976d2',
                      transform: 'scale(1.02)',
                      transition: 'transform 0.2s ease-in-out',
                      zIndex: 1
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
                      <Box sx={{ 
                        p: 2, 
                        height: 300, 
                        position: 'relative', 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <canvas 
                          ref={el => {
                            if (el) chartPreviewRefs.current[chartKey] = el;
                          }}
                          style={{ width: '100%', height: '100%' }}
                          id={`chart-${chartKey}-${index}`}
                          data-chart-type={chart.chartType}
                          data-is-ai="false"
                          data-x-axis={chart.xAxis}
                          data-y-axis={chart.yAxis}
                        />
                      </Box>
                      <Box sx={{ p: 2, mt: 'auto' }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          fullWidth
                          onClick={() => handleSaveChart(chart)}
                          disabled={fileNotFound}
                          sx={{
                            boxShadow: 2
                          }}
                        >
                          Save Visualization
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
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
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom color="text.secondary">
                    Chart Type
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    mt: 1
                  }}>
                    {['bar', 'line', 'pie', 'scatter'].map((chartType) => (
                      <Paper
                        key={chartType}
                        elevation={selectedChartType === chartType ? 3 : 1}
                        sx={{ 
                          p: 2,
                          borderRadius: 2,
                          cursor: 'pointer',
                          bgcolor: selectedChartType === chartType 
                            ? theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light' 
                            : theme.palette.mode === 'dark' ? 'background.paper' : 'white',
                          border: '1px solid',
                          borderColor: selectedChartType === chartType 
                            ? 'primary.main' 
                            : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: selectedChartType === chartType 
                            ? theme.palette.mode === 'dark' ? 'white' : 'primary.main'
                            : 'text.primary',
                          minWidth: 100,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: '1 0 auto',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: selectedChartType === chartType 
                              ? theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light' 
                              : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            transform: 'translateY(-2px)',
                          }
                        }}
                        onClick={() => setSelectedChartType(chartType)}
                      >
                        {chartType === 'bar' ? <BarChartIcon sx={{ fontSize: 36, mb: 1 }} /> : 
                         chartType === 'line' ? <ShowChartIcon sx={{ fontSize: 36, mb: 1 }} /> : 
                         chartType === 'pie' ? <PieChartIcon sx={{ fontSize: 36, mb: 1 }} /> : 
                         <ScatterPlotIcon sx={{ fontSize: 36, mb: 1 }} />}
                        <Typography variant="body1" fontWeight={selectedChartType === chartType ? 'bold' : 'normal'}>
                          {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Grid>
                
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