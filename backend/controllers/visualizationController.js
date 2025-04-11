const Visualization = require('../models/Visualization');
const File = require('../models/File');
const { parseCSV, parseJSON } = require('../utils/fileParser');
const { recommendChartType } = require('../services/aiService');

// Create new visualization
exports.createVisualization = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      fileId, 
      chartType, 
      xAxis, 
      yAxis, 
      config, 
      confidence = 90,
      data = null 
    } = req.body;

    // Validate inputs
    if (!name || !fileId || !chartType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, fileId and chartType' 
      });
    }

    // Check if file exists
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Create the visualization with user ID from auth middleware
    const visualization = new Visualization({
      name,
      description,
      fileId,
      chartType,
      xAxis,
      yAxis,
      config,
      confidence,
      data,
      user: req.user._id // Get user ID from auth middleware
    });

    await visualization.save();
    console.log(`Created visualization with ID ${visualization._id} for user ${req.user._id}`);

    res.status(201).json({
      success: true,
      visualization: {
        _id: visualization._id,
        name: visualization.name,
        description: visualization.description,
        fileId: visualization.fileId,
        chartType: visualization.chartType,
        xAxis: visualization.xAxis,
        yAxis: visualization.yAxis,
        config: visualization.config,
        data: visualization.data,
        confidence: visualization.confidence || 90,
        isAIGenerated: visualization.isAIGenerated,
        createdAt: visualization.createdAt,
        user: visualization.user
      }
    });
  } catch (error) {
    console.error('Create visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all visualizations
exports.getVisualizations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access visualizations'
      });
    }

    // Filter by fileId if provided
    const query = { user: req.user._id }; // Always filter by current user ID
    
    if (req.query.fileId) {
      query.fileId = req.query.fileId;
    }
    
    // Check if we're just looking for saved visualizations (for dashboard counter)
    const countOnly = req.query.saved === 'true';

    console.log(`Fetching visualizations for user: ${req.user._id}`, countOnly ? '(count only)' : '');
    
    // If we only need the count, just get the count
    if (countOnly) {
      const count = await Visualization.countDocuments(query);
      console.log(`Counted ${count} saved visualizations for user ${req.user._id}`);
      
      return res.status(200).json({
        success: true,
        count
      });
    }
    
    // Otherwise get all visualization data
    const visualizations = await Visualization.find(query)
      .sort({ createdAt: -1 })
      .populate('fileId', 'name type size');
    
    console.log(`Found ${visualizations.length} visualizations for user ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      count: visualizations.length,
      visualizations: visualizations.map(viz => ({
        _id: viz._id,
        name: viz.name,
        description: viz.description,
        fileId: viz.fileId,
        chartType: viz.chartType,
        config: viz.config,
        confidence: viz.confidence || (viz.isAIGenerated ? 85 : 90),
        isAIGenerated: viz.isAIGenerated,
        createdAt: viz.createdAt,
        user: viz.user
      }))
    });
  } catch (error) {
    console.error('Get visualizations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get visualization by ID
exports.getVisualizationById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to access visualization' 
      });
    }

    const visualization = await Visualization.findById(req.params.id)
      .populate('fileId', 'filename originalname dataColumns');
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (!visualization.user || visualization.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this visualization' 
      });
    }

    // Return complete visualization data including chart data if available
    res.status(200).json({
      success: true,
      visualization: {
        _id: visualization._id,
        name: visualization.name,
        description: visualization.description,
        fileId: visualization.fileId,
        chartType: visualization.chartType,
        config: visualization.config,
        xAxis: visualization.config?.xAxis?.field,
        yAxis: visualization.config?.yAxis?.field,
        data: visualization.data || {},
        isAIGenerated: visualization.isAIGenerated,
        createdAt: visualization.createdAt,
        updatedAt: visualization.updatedAt,
        user: visualization.user
      }
    });
  } catch (error) {
    console.error('Get visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update visualization
exports.updateVisualization = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to update visualization' 
      });
    }

    const { name, description, chartType, config } = req.body;
    
    // Find the visualization
    const visualization = await Visualization.findById(req.params.id);
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (!visualization.user || visualization.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this visualization' 
      });
    }

    // Update fields
    if (name) visualization.name = name;
    if (description !== undefined) visualization.description = description;
    if (chartType) visualization.chartType = chartType;
    if (config) visualization.config = config;

    await visualization.save();
    console.log(`Visualization ${req.params.id} updated by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      visualization: {
        _id: visualization._id,
        name: visualization.name,
        description: visualization.description,
        fileId: visualization.fileId,
        chartType: visualization.chartType,
        config: visualization.config,
        isAIGenerated: visualization.isAIGenerated,
        updatedAt: visualization.updatedAt,
        user: visualization.user
      }
    });
  } catch (error) {
    console.error('Update visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete visualization
exports.deleteVisualization = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to delete visualization' 
      });
    }

    const visualization = await Visualization.findById(req.params.id);
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (!visualization.user || visualization.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this visualization' 
      });
    }

    // Use deleteOne instead of remove (which is deprecated)
    await Visualization.deleteOne({ _id: req.params.id });
    console.log(`Visualization ${req.params.id} deleted by user ${req.user._id}`);

    res.status(200).json({ success: true, message: 'Visualization deleted successfully' });
  } catch (error) {
    console.error('Delete visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate AI visualization recommendation
exports.generateAIVisualization = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to generate AI visualizations' 
      });
    }

    const fileId = req.params.fileId;
    
    // Check if file exists
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Parse file data
    let data = [];
    if (file.mimetype === 'text/csv') {
      const result = await parseCSV(file.path);
      data = result.data;
    } else if (file.mimetype === 'application/json') {
      const result = await parseJSON(file.path);
      data = result.data;
    }

    // Get AI recommendation with all chart type recommendations
    const aiRecommendation = await recommendChartType(data, file.dataColumns, file.dataStats);
    
    // Extract the ordered recommendations with confidence scores
    const chartRecommendations = aiRecommendation.recommendations || [];
    
    // Get the primary (best) recommendation for reference
    const primaryRecommendation = chartRecommendations[0] || {
      chartType: 'bar',
      confidence: 70,
      xAxis: file.dataColumns[0],
      yAxis: file.dataColumns[1]
    };
    
    // Just return the recommendations without saving anything to the database
    res.status(200).json({
      success: true,
      message: 'AI visualization recommendations generated successfully',
      fileInfo: {
        _id: file._id,
        name: file.originalname || 'Data',
        columns: file.dataColumns
      },
      primaryRecommendation: {
        chartType: primaryRecommendation.chartType,
        confidence: primaryRecommendation.confidence,
        xAxis: primaryRecommendation.xAxis || primaryRecommendation.columns?.[0] || file.dataColumns[0],
        yAxis: primaryRecommendation.yAxis || primaryRecommendation.columns?.[1] || file.dataColumns[1],
        reason: primaryRecommendation.reason || aiRecommendation.explanation || `AI recommended ${primaryRecommendation.chartType} chart visualization`
      },
      chartRecommendations: chartRecommendations,
      allRecommendations: chartRecommendations
    });
  } catch (error) {
    console.error('AI visualization generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 