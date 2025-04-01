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
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Container,
  Chip,
  CircularProgress,
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Description as FileIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
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
      console.log('Fetching files from backend...');
      const response = await fetch('/api/files');
      const data = await response.json();
      console.log('Files response:', data);
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
  };

  const handleFileUploadSuccess = async (uploadedFile) => {
    console.log('File uploaded successfully:', uploadedFile);
    await fetchFiles(); // Refresh the file list
    handleCloseUploadDialog();
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // Get auth token if available
      const token = localStorage.getItem('authToken');
      await fetch(`/api/files/${fileId}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      await fetchFiles(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      // Get auth token if available
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleViewFile = async (fileId) => {
    try {
      // Get the file details
      const response = await fetch(`/api/files/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file details');
      }
      
      const data = await response.json();
      console.log('File preview data:', data);
      
      // Set preview data and open modal
      setPreviewData(data.file);
      setOpenPreviewDialog(true);
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to load file preview');
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          File Manager
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenUploadDialog(true)}
        >
          Upload New File
        </Button>
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
                            label={file.type} 
                            size="small" 
                            color={
                              file.type === 'csv' ? 'success' : 
                              file.type === 'json' ? 'info' : 
                              file.type === 'excel' ? 'primary' : 
                              'default'
                            }
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
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
                              onClick={() => handleDeleteFile(file._id)}
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
                    <Chip size="small" label={previewData.type} color="primary" />
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">Size:</Typography>
                  <Typography variant="body2">{previewData.size ? `${(previewData.size / 1024).toFixed(2)} KB` : 'Unknown'}</Typography>
                  
                  <Typography variant="body2" color="textSecondary">Uploaded:</Typography>
                  <Typography variant="body2">{new Date(previewData.createdAt).toLocaleString()}</Typography>
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
                    }
                  }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {previewData.data.headers.map((header, index) => (
                            <TableCell key={index} sx={{ 
                              fontWeight: 'bold',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                            }}>
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.data.rows.map((row, rowIndex) => (
                          <TableRow key={rowIndex} hover>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
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
    </Container>
  );
}

export default FileManager; 