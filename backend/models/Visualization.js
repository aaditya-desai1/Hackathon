const mongoose = require('mongoose');

const VisualizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  chartType: {
    type: String,
    required: true,
    enum: ['bar', 'line', 'pie', 'scatter', 'histogram', 'heatmap', 'box', 'radar', 'bubble']
  },
  confidence: {
    type: Number,
    default: 90,
    min: 0,
    max: 100
  },
  // For backward compatibility, store x and y axis separately
  xAxis: {
    type: String
  },
  yAxis: {
    type: String
  },
  // Store actual chart data
  data: {
    labels: [mongoose.Schema.Types.Mixed],
    values: [mongoose.Schema.Types.Mixed],
    datasets: [mongoose.Schema.Types.Mixed]
  },
  config: {
    xAxis: {
      field: String,
      label: String
    },
    yAxis: {
      field: String,
      label: String
    },
    filters: [{
      field: String,
      operator: {
        type: String,
        enum: ['=', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    colors: [String],
    title: String,
    subtitle: String,
    dimensions: {
      width: Number,
      height: Number
    },
    groupBy: String,
    aggregation: {
      function: {
        type: String,
        enum: ['sum', 'avg', 'min', 'max', 'count']
      },
      field: String
    }
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
VisualizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Visualization', VisualizationSchema); 