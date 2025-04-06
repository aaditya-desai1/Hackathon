import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  CloudUpload as UploadIcon,
  BarChart as ChartIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';

function Help() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Help & Documentation"
        subtitle="Learn how to use DataViz Pro effectively"
        icon={<HelpIcon />}
      />
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Getting Started
        </Typography>
        <Typography paragraph>
          Welcome to DataViz Pro! This application helps you visualize your data quickly and easily.
          Follow these steps to get started:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="1. Explore the Dashboard" 
              secondary="Get an overview of your data and visualizations" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <UploadIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="2. Upload Your Data" 
              secondary="Go to File Manager and upload CSV or JSON files" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ChartIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="3. Create Visualizations" 
              secondary="Generate charts based on your data with AI assistance" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SettingsIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="4. Customize Settings" 
              secondary="Adjust application preferences to your liking" 
            />
          </ListItem>
        </List>
      </Paper>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Frequently Asked Questions
      </Typography>
      
      <Accordion sx={{ 
        mb: 2, 
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        '&:before': {
          display: 'none',
        }
      }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1">What file formats are supported?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Currently, DataViz Pro supports CSV and JSON file formats. We plan to add support for Excel files in a future update.
            Make sure your data is properly formatted for best results.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ 
        mb: 2, 
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        '&:before': {
          display: 'none',
        }
      }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1">How does the AI recommendation system work?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Our AI system analyzes your data structure, column types, and relationships between variables to suggest the most appropriate visualization types.
            It considers factors such as:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• Data distribution and patterns" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Variable types (categorical, numerical, temporal)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Statistical correlations between variables" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Best practices in data visualization" />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ 
        mb: 2, 
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        '&:before': {
          display: 'none',
        }
      }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1">Can I export my visualizations?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Yes, you can export any visualization as a PNG image. In the future, we plan to add support for exporting to PDF and interactive HTML formats.
            Just click the "Save Visualization" button when viewing a chart and select your preferred download method.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 4, p: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Need more help?
        </Typography>
        <Typography>
          Contact our support team at support@datavizpro.example.com or visit our documentation website for detailed tutorials.
        </Typography>
      </Box>
    </Container>
  );
}

export default Help; 