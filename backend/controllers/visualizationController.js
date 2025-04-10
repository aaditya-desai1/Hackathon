const Visualization = require('../models/Visualization');
const File = require('../models/File');
const { parseCSV, parseJSON } = require('../utils/dataParser');
const { recommendChartType } = require('../services/aiService');

// Create new visualization
exports.createVisualization = async (req, res) => {
  try {
    const { name, description, fileId, chartType, config, confidence = 90 } = req.body;

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

    // Create the visualization
    const visualization = new Visualization({
      name,
      description,
      fileId,
      chartType,
      config,
      confidence,
      user: req.user ? req.user._id : null
    });

    await visualization.save();

    res.status(201).json({
      success: true,
      visualization: {
        _id: visualization._id,
        name: visualization.name,
        description: visualization.description,
        fileId: visualization.fileId,
        chartType: visualization.chartType,
        config: visualization.config,
        confidence: visualization.confidence || 90,
        isAIGenerated: visualization.isAIGenerated,
        createdAt: visualization.createdAt
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
    // Filter by fileId if provided
    const query = {};
    if (req.query.fileId) {
      query.fileId = req.query.fileId;
    }
    
    // Filter by user if authenticated
    if (req.user) {
      query.user = req.user._id;
    }

    const visualizations = await Visualization.find(query)
      .sort({ createdAt: -1 })
      .populate('fileId', 'name type size');
    
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
        createdAt: viz.createdAt
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
    const visualization = await Visualization.findById(req.params.id)
      .populate('fileId', 'filename originalname dataColumns');
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (req.user && visualization.user && req.user.id !== visualization.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this visualization' });
    }

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
        createdAt: visualization.createdAt,
        updatedAt: visualization.updatedAt
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
    const { name, description, chartType, config } = req.body;
    
    // Find the visualization
    const visualization = await Visualization.findById(req.params.id);
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (req.user && visualization.user && req.user.id !== visualization.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this visualization' });
    }

    // Update fields
    if (name) visualization.name = name;
    if (description !== undefined) visualization.description = description;
    if (chartType) visualization.chartType = chartType;
    if (config) visualization.config = config;

    await visualization.save();

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
        updatedAt: visualization.updatedAt
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
    const visualization = await Visualization.findById(req.params.id);
    
    if (!visualization) {
      return res.status(404).json({ success: false, message: 'Visualization not found' });
    }

    // Check if user owns the visualization
    if (req.user && visualization.user && req.user.id !== visualization.user.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this visualization' });
    }

    // Use deleteOne instead of remove (which is deprecated)
    await Visualization.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'Visualization deleted successfully' });
  } catch (error) {
    console.error('Delete visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate AI visualization recommendation
exports.generateAIVisualization = async (req, res) => {
  try {
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
    
    // Get the primary (best) recommendation
    const primaryRecommendation = chartRecommendations[0] || {
      chartType: 'bar',
      confidence: 70,
      reason: 'Default bar chart recommendation'
    };

    // Create new visualization with AI recommendation
    const visualization = new Visualization({
      name: `${file.originalname.split('.')[0]} - AI Recommended Visualization`,
      description: 'Automatically generated visualization based on data analysis',
      fileId: file._id,
      chartType: primaryRecommendation.chartType,
      config: aiRecommendation.config,
      confidence: primaryRecommendation.confidence,
      isAIGenerated: true,
      user: req.user ? req.user.id : null
    });

    await visualization.save();

    res.status(201).json({
      success: true,
      message: 'AI visualization created successfully',
      recommendation: primaryRecommendation.reason,
      chartRecommendations: chartRecommendations,
      visualization: {
        _id: visualization._id,
        name: visualization.name,
        description: visualization.description,
        fileId: visualization.fileId,
        chartType: visualization.chartType,
        config: visualization.config,
        confidence: visualization.confidence,
        isAIGenerated: visualization.isAIGenerated,
        createdAt: visualization.createdAt
      }
    });
  } catch (error) {
    console.error('AI visualization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 