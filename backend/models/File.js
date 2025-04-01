const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a file name'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please provide a file type'],
    enum: ['text/csv', 'application/json']
  },
  size: {
    type: Number,
    required: [true, 'Please provide a file size']
  },
  path: {
    type: String,
    required: [true, 'Please provide a file path']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  dataColumns: {
    type: [String],
    default: []
  },
  dataPreview: {
    type: Array,
    default: []
  },
  dataStats: {
    type: Object,
    default: {}
  },
  isAnalyzed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ user: 1, createdAt: -1 });

// Clean up file on document removal
fileSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs').promises;
    await fs.unlink(this.path);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('File', fileSchema); 