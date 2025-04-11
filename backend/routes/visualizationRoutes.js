const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers
const { 
  createVisualization, 
  getVisualizations, 
  getVisualizationById, 
  updateVisualization, 
  deleteVisualization,
  generateAIVisualization
} = require('../controllers/visualizationController');

// Routes for visualization management (all require authentication)
router.post('/', auth, createVisualization);
router.get('/', auth, getVisualizations);
router.get('/:id', auth, getVisualizationById);
router.put('/:id', auth, updateVisualization);
router.delete('/:id', auth, deleteVisualization);

// Route for AI-driven chart recommendation
router.post('/recommend/:fileId', auth, generateAIVisualization);

// Debug endpoint to check visualizations in database
router.get('/debug', async (req, res) => {
  try {
    console.log('Debug endpoint: Checking visualizations collection');
    const count = await Visualization.countDocuments();
    const visualizations = await Visualization.find().limit(10);
    
    res.json({
      success: true,
      count,
      visualizations: visualizations.map(v => ({
        _id: v._id,
        name: v.name,
        chartType: v.chartType,
        created: v.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 