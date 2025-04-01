import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Chip,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SortIcon from '@mui/icons-material/Sort';
import EmptyState from '../common/EmptyState';

function FileList({ files = [], onFileSelect, onFileDelete, onFileDownload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  if (!files || files.length === 0) {
    return (
      <EmptyState 
        icon={<DescriptionIcon sx={{ fontSize: 60 }} />}
        title="No files available"
        description="Upload files to see them listed here"
        compact
      />
    );
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const getSortTooltip = () => {
    return `Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`;
  };

  const getFileTypeColor = (fileType) => {
    if (fileType.includes('csv')) return 'success';
    if (fileType.includes('json')) return 'info';
    if (fileType.includes('text')) return 'warning';
    return 'default';
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType.includes('csv') || fileType.includes('json') || fileType.includes('text')) {
      return <DescriptionIcon />;
    }
    return <InsertDriveFileIcon />;
  };

  const formatDate = (date) => {
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter files based on search term
  const filteredFiles = files.filter((file) => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files by date
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.lastModified) - new Date(a.lastModified);
    } else {
      return new Date(a.lastModified) - new Date(b.lastModified);
    }
  });

  return (
    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" gutterBottom>Files</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            variant="outlined"
            sx={{ 
              p: '2px 4px', 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              mb: 1,
            }}
          >
            <SearchIcon sx={{ p: '10px', color: 'text.secondary' }} />
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search files..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </Paper>

          <Tooltip title={getSortTooltip()}>
            <IconButton onClick={toggleSortOrder} size="small" sx={{ ml: 1 }}>
              <SortIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} found
          </Typography>
        </Box>
      </Box>

      <Divider />
      
      <List sx={{ overflow: 'auto', flexGrow: 1 }}>
        {sortedFiles.map((file, index) => (
          <React.Fragment key={file.name + file.lastModified}>
            <ListItem 
              disablePadding
              secondaryAction={
                <Box>
                  {onFileDownload && (
                    <Tooltip title="Download">
                      <IconButton 
                        edge="end" 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileDownload(file);
                        }}
                      >
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onFileDelete && (
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileDelete(file);
                        }}
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemButton onClick={() => onFileSelect(file)}>
                <ListItemIcon>
                  {getFileTypeIcon(file.type)}
                </ListItemIcon>
                <ListItemText 
                  primary={file.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={file.type.split('/')[1].toUpperCase()} 
                        color={getFileTypeColor(file.type)}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < sortedFiles.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}

export default FileList; 