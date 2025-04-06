const mongoose = require('mongoose');
const File = require('./models/File');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dataviz')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Find all files first to see what's in the database
    return File.find().then(files => {
      console.log('All files in database:');
      files.forEach(file => {
        console.log({
          id: file._id.toString(),
          name: file.name,
          path: file.path,
          size: file.size
        });
      });
      
      // Find the specific file record to delete
      return File.findOne({ name: 'sample_employee_data.csv' });
    });
  })
  .then(file => {
    if (!file) {
      console.log('File record not found');
      return null;
    }
    
    console.log('Found file record:', file);
    
    // Delete the file record from the database
    return File.deleteOne({ _id: file._id }).then(() => {
      console.log('File record deleted from database');
      return file.path;
    });
  })
  .then(filePath => {
    if (!filePath) return;
    
    // Try to delete physical file if exists
    const fs = require('fs').promises;
    return fs.unlink(filePath)
      .then(() => console.log('Physical file deleted'))
      .catch(err => console.log('Physical file deletion error (this is expected if file is missing):', err.message));
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }); 