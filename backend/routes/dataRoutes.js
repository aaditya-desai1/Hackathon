const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getDataFromFile, 
  analyzeData, 
  applyTransformation, 
  filterData, 
  exportData 
} = require('../controllers/dataController');

// Routes for data analysis and processing
router.get('/file/:fileId', getDataFromFile);
router.post('/analyze/:fileId', analyzeData);
router.post('/transform/:fileId', applyTransformation);
router.post('/filter/:fileId', filterData);
router.get('/export/:fileId', exportData);

// Placeholder routes for data operations
router.get('/', (req, res) => {
  res.json({ message: 'Data routes working' });
});

module.exports = router; 