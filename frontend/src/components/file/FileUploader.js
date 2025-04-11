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
import { fetchApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Import the getApiBaseUrl function from api.js
import { getApiBaseUrl } from '../../services/api';

// Use the same method as the rest of the application
const API_BASE_URL = getApiBaseUrl();

function FileUploader({ onUploadSuccess, allowedTypes }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const { isAuthenticated } = useAuth();

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
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('You must be logged in to upload files');
      return;
    }
    
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
      let fileToUpload = file;
      
      // For JSON files, ensure we have valid JSON by pre-processing it
      if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
        try {
          console.log('Processing JSON file before upload');
          // Read the entire file content
          const fileContent = await readFileSlice(file);
          
          // Clean the content of BOM and whitespace
          const cleanContent = fileContent.replace(/^\uFEFF/, '').trim();
          
          // Try to parse and re-stringify to ensure valid JSON format
          let validJson;
          
          try {
            // Attempt to parse the JSON
            const parsedData = JSON.parse(cleanContent);
            validJson = JSON.stringify(parsedData);
            console.log('Successfully parsed and validated JSON content');
          } catch (jsonError) {
            console.error('Error parsing JSON content:', jsonError);
            
            // Try to extract valid JSON from the content
            let extractedContent = null;
            
            // Find the start of a JSON object or array
            const firstBrace = cleanContent.indexOf('{');
            const firstBracket = cleanContent.indexOf('[');
            
            if (firstBrace === -1 && firstBracket === -1) {
              throw new Error('No valid JSON structure found in file');
            }
            
            const startIndex = (firstBrace !== -1 && firstBracket !== -1)
              ? Math.min(firstBrace, firstBracket)
              : Math.max(firstBrace, firstBracket);
            
            if (startIndex >= 0) {
              // Extract substring starting from JSON structure
              extractedContent = cleanContent.substring(startIndex);
              
              // Determine if we're dealing with an object or array
              const isArray = extractedContent.startsWith('[');
              
              // Find the matching closing bracket/brace
              let depth = 0;
              let endPos = -1;
              let inString = false;
              let escapeNext = false;
              
              for (let i = 0; i < extractedContent.length; i++) {
                const char = extractedContent[i];
                
                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }
                
                if (char === '\\') {
                  escapeNext = true;
                  continue;
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }
                
                if (inString) continue;
                
                if ((isArray && char === '[') || (!isArray && char === '{')) {
                  depth++;
                } else if ((isArray && char === ']') || (!isArray && char === '}')) {
                  depth--;
                  if (depth === 0) {
                    endPos = i + 1;
                    break;
                  }
                }
              }
              
              if (endPos > 0) {
                // Extract just the valid JSON part
                extractedContent = extractedContent.substring(0, endPos);
                
                try {
                  // Verify it's valid JSON
                  const parsedData = JSON.parse(extractedContent);
                  validJson = JSON.stringify(parsedData);
                  console.log('Successfully extracted and validated JSON content');
                } catch (extractError) {
                  console.error('Failed to extract valid JSON:', extractError);
                  throw new Error(`Could not extract valid JSON: ${extractError.message}`);
                }
              } else {
                throw new Error('Could not find complete JSON structure');
              }
            } else {
              throw new Error('No valid JSON structure found');
            }
          }
          
          // Create a new file with the valid JSON content
          if (validJson) {
            fileToUpload = new File(
              [validJson], 
              file.name, 
              { type: 'application/json' }
            );
            console.log('Created sanitized JSON file for upload');
          }
        } catch (preprocessError) {
          console.error('Failed to pre-process JSON file:', preprocessError);
          // Continue with original file if pre-processing fails
          setError(`Warning: Could not validate JSON format: ${preprocessError.message}. Attempting upload anyway.`);
        }
      }
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('fileName', fileToUpload.name);
      
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found in localStorage');
        throw new Error('Authentication required. Please login again.');
      }
      
      console.log('Uploading file to API...', {
        url: `${API_BASE_URL}/api/files/upload`,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
        tokenExists: !!token,
        tokenLength: token ? token.length : 0
      });
      
      // For file uploads, we need to use direct fetch with FormData
      // because fetchApi automatically sets Content-Type to application/json
      const uploadUrl = `${API_BASE_URL}/api/files/upload`;
      
      // Use fetch directly with appropriate headers
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
          // NOTE: Do NOT set Content-Type header for FormData/multipart
        },
        credentials: 'include', // Include cookies for cross-domain requests
        mode: 'cors' // Ensure CORS mode is set properly
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        // Try to extract error message from the response
        let errorMessage = `HTTP error: ${response.status}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.error('Upload error response:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (e) {
          // If we can't parse the JSON, just use the status text
          errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        }
        
        // Special handling for auth errors
        if (response.status === 401) {
          console.error('Authentication error during file upload');
          localStorage.removeItem('authToken'); // Clear invalid token
          errorMessage = 'Your session has expired. Please login again.';
          window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: errorMessage }}));
        }
        
        // Special handling for CORS errors
        if (response.status === 0) {
          console.error('Possible CORS error during file upload');
          errorMessage = 'Network error: Could not connect to the server. This might be due to CORS restrictions.';
        }
        
        setErrorDetails(errorDetails);
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
      clearInterval(progressInterval);
    } finally {
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
