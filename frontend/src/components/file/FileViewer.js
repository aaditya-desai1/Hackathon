import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import EmptyState from '../common/EmptyState';

function FileViewer({ file, data }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  if (!file || !data) {
    return <EmptyState 
      icon={<DescriptionIcon sx={{ fontSize: 60 }} />}
      title="No file selected"
      description="Please select a file to view its contents"
    />;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderFileInfo = () => {
    const fileInfo = [
      { label: 'Filename', value: file.name },
      { label: 'File type', value: file.type },
      { label: 'Size', value: `${Math.round(file.size / 1024)} KB` },
      { label: 'Last modified', value: new Date(file.lastModified).toLocaleString() },
    ];

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>File Information</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableBody>
              {fileInfo.map((info) => (
                <TableRow key={info.label}>
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ fontWeight: 'bold', width: '30%' }}
                  >
                    {info.label}
                  </TableCell>
                  <TableCell>{info.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderDataTable = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <EmptyState 
          icon={<TableChartIcon sx={{ fontSize: 60 }} />}
          title="No tabular data"
          description="This file doesn't contain tabular data that can be displayed"
          compact
        />
      );
    }

    const headers = Object.keys(data[0]);
    
    // Filter data based on search term
    const filteredData = searchTerm 
      ? data.filter(row => 
          Object.values(row).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : data;

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Showing {filteredData.length} of {data.length} rows
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index} hover>
                  {headers.map(header => (
                    <TableCell key={`${index}-${header}`}>
                      {typeof row[header] === 'boolean' 
                        ? <Chip 
                            label={row[header] ? 'True' : 'False'} 
                            color={row[header] ? 'success' : 'default'}
                            size="small"
                          />
                        : String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderRawData = () => {
    const stringData = typeof data === 'string' 
      ? data 
      : JSON.stringify(data, null, 2);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Paper 
          variant="outlined"
          sx={{ 
            p: 2, 
            maxHeight: 500, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            backgroundColor: 'background.default'
          }}
        >
          {stringData}
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">{file.name}</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 0 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab icon={<TableChartIcon />} label="Table" />
          <Tab icon={<CodeIcon />} label="Raw" />
          <Tab icon={<InfoIcon />} label="Info" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && renderDataTable()}
          {activeTab === 1 && renderRawData()}
          {activeTab === 2 && renderFileInfo()}
        </Box>
      </Paper>
    </Box>
  );
}

export default FileViewer; 