import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  Button,
  CircularProgress,
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
  const [validating, setValidating] = useState(false);

  // Function to validate file content before upload
  const validateFileContent = async (file) => {
    setValidating(true);
    try {
      // Basic file validation
      if (file.size === 0) {
        throw new Error('File is empty');
      }

      // For larger files, just check a sample
      const maxSizeToCheck = 50 * 1024; // 50KB
      const sizeToCheck = Math.min(file.size, maxSizeToCheck);
      
      // Read a portion of the file to check its format
      const fileSlice = file.slice(0, sizeToCheck);
      const content = await readFileSlice(fileSlice);
      
      // Check if the file appears to be JSON
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
        validateJsonContent(content);
      }
      
      // Check if the file appears to be CSV 
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        validateCsvContent(content);
      }
      
      return true;
    } catch (error) {
      console.error('File validation error:', error);
      setError(`File validation failed: ${error.message}`);
      return false;
    } finally {
      setValidating(false);
    }
  };
  
  // Helper function to read a file slice
  const readFileSlice = (fileSlice) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(fileSlice);
    });
  };
  
  // Helper function to validate JSON content
  const validateJsonContent = (content) => {
    try {
      // Clean the content of BOM and other characters
      const cleanContent = content.trim().replace(/^\uFEFF/, '');
      
      // Check if content starts with { or [
      if (!(cleanContent.startsWith('{') || cleanContent.startsWith('['))) {
        throw new Error('JSON file must start with { or [');
      }
      
      // Try to parse the JSON
      JSON.parse(cleanContent);
    } catch (e) {
      throw new Error(`Invalid JSON format: ${e.message}`);
    }
  };
  
  // Helper function to validate CSV content
  const validateCsvContent = (content) => {
    // Check if content has commas or tabs
    if (!content.includes(',') && !content.includes('\t') && !content.includes(';')) {
      throw new Error('CSV file does not contain any delimiters (comma, tab, or semicolon)');
    }
    
    // Check if there are at least some rows
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('CSV file does not contain any data');
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setErrorDetails(null);
    setSuccess(false);
    setUploadProgress(0);
    
    // Validate file content first
    const isValid = await validateFileContent(file);
    if (!isValid) {
      setUploading(false);
      return;
    }
    
    // Simulate upload progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        const newProgress = Math.min(prevProgress + 5, 90);
        return newProgress;
      });
    }, 100);
    
    try {
      const formData = new FormData();
      
      // Create a sanitized file if it's JSON to ensure proper content
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
        try {
          // Read the file content
          const content = await readFileSlice(file);
          
          // Clean and validate content
          const cleanContent = content.trim().replace(/^\uFEFF/, '');
          let validJsonContent;
          
          try {
            // Attempt to parse and stringify to ensure valid JSON
            const parsedData = JSON.parse(cleanContent);
            validJsonContent = JSON.stringify(parsedData);
          } catch (err) {
            // If standard parsing fails, try to extract valid JSON
            const jsonStart = Math.max(
              cleanContent.indexOf('{'), 
              cleanContent.indexOf('[')
            );
            
            if (jsonStart >= 0) {
              let extractedContent = cleanContent.substring(jsonStart);
              // Find matching end bracket/brace
              const isArray = extractedContent.startsWith('[');
              let count = 1;
              let endPos = -1;
              
              for (let i = 1; i < extractedContent.length; i++) {
                const char = extractedContent[i];
                if ((isArray && char === '[') || (!isArray && char === '{')) count++;
                if ((isArray && char === ']') || (!isArray && char === '}')) count--;
                
                if (count === 0) {
                  endPos = i;
                  break;
                }
              }
              
              if (endPos > 0) {
                extractedContent = extractedContent.substring(0, endPos + 1);
                try {
                  // Verify we have valid JSON
                  const parsed = JSON.parse(extractedContent);
                  validJsonContent = JSON.stringify(parsed);
                } catch (e) {
                  throw new Error(`Could not extract valid JSON: ${e.message}`);
                }
              } else {
                throw new Error('Could not find matching closing bracket/brace in JSON');
              }
            } else {
              throw new Error('No valid JSON structure found in file');
            }
          }
          
          // Create a new sanitized file with the valid JSON
          const sanitizedFile = new File(
            [validJsonContent], 
            file.name, 
            { type: 'application/json' }
          );
          
          formData.append('file', sanitizedFile);
          console.log('Using sanitized JSON file for upload');
        } catch (error) {
          console.error('Error sanitizing JSON file:', error);
          // Fall back to the original file if sanitization fails
          formData.append('file', file);
        }
      } else {
        // For non-JSON files, use as-is
        formData.append('file', file);
      }
      
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
    
    // Check file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    console.log(`File extension: ${fileExtension}, MIME type: ${file.type}`);
    
    // Check if file type is allowed based on both MIME type and extension
    const isAllowedMimeType = allowedTypes.includes(file.type);
    const isAllowedExtension = ['csv', 'json', 'txt'].includes(fileExtension);
    
    if (!isAllowedMimeType && !isAllowedExtension) {
      setError(`File type not supported. Please upload CSV, JSON, or TXT files.`);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    
    // Upload the file immediately when dropped
    uploadFile(file);
  }, [allowedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt', '.csv', '.json']
    },
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
          cursor: (uploading || validating) ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: (uploading || validating) ? 'grey.300' : 'primary.main',
            backgroundColor: (uploading || validating) ? 'background.paper' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} disabled={uploading || validating} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {validating ? (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Validating file...
              </Typography>
            </>
          ) : (
            <>
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
            </>
          )}
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