const express = require('express');
const router = express.Router();

// Import controllers
const { 
  createVisualization, 
  getVisualizations, 
  getVisualizationById, 
  updateVisualization, 
  deleteVisualization,
  generateAIVisualization
} = require('../controllers/visualizationController');

// Routes for visualization management (all public for testing)
router.post('/', createVisualization);
router.get('/', getVisualizations);
router.get('/:id', getVisualizationById);
router.put('/:id', updateVisualization);
router.delete('/:id', deleteVisualization);

// Route for AI-driven chart recommendation
router.post('/recommend/:fileId', generateAIVisualization);

module.exports = router; 