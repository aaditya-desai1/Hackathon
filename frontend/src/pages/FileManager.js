import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Container,
  Chip,
  CircularProgress,
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import FileUploader from '../components/file/FileUploader';

function FileManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (date.toString() === 'Invalid Date') return 'Unknown date';
    
    try {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (date.toString() === 'Invalid Date') return 'Unknown date';
    
    try {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  useEffect(() => {
    // Check if we should open the upload dialog from navigation state
    if (location.state?.openUploadDialog) {
      setOpenUploadDialog(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Load files from backend
    fetchFiles();
  }, [location]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Use environment-aware API endpoint
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/files`;
      
      console.log('Fetching files from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch files: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched files:', data);
      
      if (data.success && Array.isArray(data.files)) {
        console.log(`Retrieved ${data.files.length} files successfully`);
        setFiles(data.files);
      } else {
        // If there's an issue with the response format, use empty array
        console.warn('Unexpected response format:', data);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
  };

  const handleFileUploadSuccess = async (uploadedFile) => {
    console.log('Upload success callback triggered with file:', uploadedFile);
    
    // Refresh the file list immediately
    await fetchFiles();
    
    // Wait a moment before closing the dialog to show success
    setTimeout(() => {
      handleCloseUploadDialog();
    }, 1000);
  };

  const handleDeleteFile = async (fileId) => {
    try {
      setLoading(true);
      
      // Use environment-aware API endpoint
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/files/${fileId}`;
      
      console.log('Deleting file from:', url);
      
      // Make the real API call to delete a file
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to delete file: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
      }
      
      console.log('File deleted successfully:', fileId);
      
      // Refresh the file list
      await fetchFiles();
      
      // Close dialog
      setOpenDeleteDialog(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      handleDeleteFile(fileToDelete._id);
    }
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setOpenDeleteDialog(true);
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
    setFileToDelete(null);
  };

  const handleViewFile = async (fileId) => {
    try {
      // Use environment-aware API endpoint
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/files/${fileId}/preview`;
      
      console.log('Fetching file preview from:', url);
      
      // Get the file from the API
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to get file preview: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to get file preview: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('File preview data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load preview');
      }
      
      // Create the preview data structure
      const previewData = {
        _id: fileId,
        name: data.file?.name || 'Unknown file',
        type: data.file?.type || 'text/plain',
        size: data.file?.size || 0,
        createdAt: data.file?.createdAt,
        data: {
          headers: data.headers || [],
          rows: data.rows || []
        }
      };
      
      // Set preview data and open modal
      setPreviewData(previewData);
      setOpenPreviewDialog(true);
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to load file preview: ' + error.message);
    }
  };

  const handleClosePreview = () => {
    setOpenPreviewDialog(false);
    setPreviewData(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper function to get color for file type chip
  const getFileTypeColor = (type) => {
    switch (type) {
      case 'text/csv': return 'success';
      case 'application/json': return 'info';
      default: return 'default';
    }
  };

  // Helper to get readable file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteAllFiles = async () => {
    try {
      if (!window.confirm('Are you sure you want to delete ALL files from the database? This action cannot be undone.')) {
        return;
      }
      
      setLoading(true);
      
      // Use environment-aware API endpoint
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/files/cleanup-database`;
      
      console.log('Cleaning up database from:', url);
      
      // Call the cleanup endpoint
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean up database');
      }
      
      const result = await response.json();
      console.log('Cleanup result:', result);
      
      // Refresh the file list
      await fetchFiles();
      
      alert(`Successfully removed ${result.filesDeleted} files from the database.`);
    } catch (error) {
      console.error('Error cleaning up database:', error);
      alert(`Error cleaning up database: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          File Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAllFiles}
            sx={{ display: files.length > 0 ? 'flex' : 'none' }}
          >
            Delete All Files
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload New File
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
          <Typography variant="h6">No files uploaded yet</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Upload your first file to get started
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload File
          </Button>
        </Paper>
      ) : (
        <>
          <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((file) => (
                      <TableRow key={file._id} hover>
                        <TableCell>{file.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={file.type.split('/')[1] || file.type} 
                            size="small" 
                            color={getFileTypeColor(file.type)}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>{formatDate(file.createdAt)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color="primary"
                              onClick={() => handleViewFile(file._id)}
                              size="small"
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                '&:hover': { 
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' 
                                }
                              }}
                              title="View file"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteClick(file)}
                              size="small"
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                '&:hover': { 
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' 
                                }
                              }}
                              title="Delete file"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={files.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}

      {/* File Preview Dialog */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
          }
        }}
      >
        <DialogTitle>
          File Preview: {previewData?.name}
        </DialogTitle>
        <DialogContent dividers>
          {previewData ? (
            <>
              <Box sx={{ mb: 3, p: 2, borderRadius: 1, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle1" gutterBottom>File Details</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary">Type:</Typography>
                  <Typography variant="body2">
                    <Chip size="small" label={previewData.type.split('/')[1] || previewData.type} color={getFileTypeColor(previewData.type)} />
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">Size:</Typography>
                  <Typography variant="body2">{formatFileSize(previewData.size)}</Typography>
                  
                  <Typography variant="body2" color="textSecondary">Uploaded:</Typography>
                  <Typography variant="body2">{formatDateTime(previewData.createdAt)}</Typography>
                </Box>
              </Box>

              {previewData.data && (
                <>
                  <Typography variant="subtitle1" gutterBottom>Data Preview</Typography>
                  <TableContainer sx={{ 
                    maxHeight: 350, 
                    border: 1, 
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
                    borderRadius: 1,
                    '& .MuiTableCell-root': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      padding: '8px 16px',
                      whiteSpace: 'nowrap'
                    },
                    '& .MuiTableCell-head': {
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10
                    }
                  }}>
                    <Table size="small" stickyHeader={false}>
                      <TableHead>
                        <TableRow>
                          {previewData.data.headers.map((header, index) => (
                            <TableCell 
                              key={index} 
                              align="left"
                              sx={{ minWidth: 80 }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(previewData.data.rows) && previewData.data.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex} hover>
                            {Array.isArray(row) ? (
                              // Handle array row format
                              row.map((cell, cellIndex) => (
                                <TableCell 
                                  key={cellIndex}
                                  align="left"
                                >
                                  {cell !== null && cell !== undefined ? String(cell) : ''}
                                </TableCell>
                              ))
                            ) : typeof row === 'object' ? (
                              // Handle object row format
                              previewData.data.headers.map((header, cellIndex) => (
                                <TableCell 
                                  key={cellIndex}
                                  align="left"
                                >
                                  {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                                </TableCell>
                              ))
                            ) : (
                              // Fallback for unexpected data format
                              <TableCell align="left">{String(row)}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              handleClosePreview();
              navigate('/visualizations', { state: { fileId: previewData?._id } });
            }}
          >
            Create Visualization
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUploader 
            onUploadSuccess={handleFileUploadSuccess}
            allowedTypes={['text/csv', 'application/json', 'text/plain']}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Delete File
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DeleteIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h6">
              Are you sure?
            </Typography>
          </Box>
          <Typography>
            The file "{fileToDelete?.name}" will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCancelDelete} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FileManager; 