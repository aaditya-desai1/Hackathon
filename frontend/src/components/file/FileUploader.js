import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function FileUploader({ onUploadSuccess, allowedTypes }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setErrorDetails(null);
    setSuccess(false);
    setUploadProgress(0);
    
    // Simulate upload progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        const newProgress = Math.min(prevProgress + 5, 90);
        return newProgress;
      });
    }, 100);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the absolute URL path for consistent behavior in all environments
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/files/upload`;
      
      console.log('Uploading file to:', url);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Do not set Content-Type header for FormData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        console.error('Upload failed with status:', response.status);
        let errorMessage = `Upload failed with status ${response.status}`;
        let details = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          details = errorData;
          console.error('Error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          details = { parseError: parseError.message };
        }
        
        setErrorDetails(details);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      setUploadProgress(100);
      setSuccess(true);
      
      // Wait a moment to show success message before closing
      setTimeout(() => {
        setSelectedFile(null);
        setFileName('');
        
        // Call the success callback with the file data
        if (onUploadSuccess && data.file) {
          console.log('Calling onUploadSuccess with file:', data.file);
          onUploadSuccess(data.file);
        }
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]; // Handle one file at a time
    
    if (!file) return;
    
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported. Please upload ${allowedTypes.join(', ')} files.`);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    
    // Upload the file immediately when dropped
    uploadFile(file);
  }, [allowedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    multiple: false,
  });

  // Add retry functionality
  const handleRetry = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {errorDetails && (
            <Box component="pre" sx={{ mt: 1, fontSize: '0.8rem', maxHeight: '100px', overflow: 'auto' }}>
              {JSON.stringify(errorDetails, null, 2)}
            </Box>
          )}
          {selectedFile && (
            <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={handleRetry}>
              Try Again
            </Button>
          )}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          File uploaded successfully!
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: uploading ? 'grey.300' : 'primary.main',
            backgroundColor: uploading ? 'background.paper' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} disabled={uploading} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <CloudUploadIcon
            sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop the file here'
              : uploading
              ? 'Uploading...'
              : 'Drag and drop a file here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: CSV, JSON, and text files
          </Typography>
        </Box>
      </Paper>

      {uploadProgress > 0 && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            {uploadProgress < 100 ? `${uploadProgress}% uploaded` : 'Upload complete!'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default FileUploader; 