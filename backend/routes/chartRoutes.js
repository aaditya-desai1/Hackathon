const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chartController');

// Get chart recommendations for a file
router.get('/recommendations/:fileId', chartController.getChartRecommendations);

module.exports = router; 