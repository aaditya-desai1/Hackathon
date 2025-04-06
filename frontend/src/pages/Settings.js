import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import { useColorMode } from '../App';
import PageHeader from '../components/common/PageHeader';
import SettingsIcon from '@mui/icons-material/Settings';

function Settings() {
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Settings"
        subtitle="Configure your application preferences"
        icon={<SettingsIcon />}
      />
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Appearance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={theme.palette.mode === 'dark'}
                    onChange={colorMode.toggleColorMode}
                    color="primary"
                  />
                }
                label="Dark Mode"
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Switch between light and dark themes
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper 
        sx={{ 
          p: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Data Preferences
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Auto-analyze uploaded files"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Automatically analyze data when files are uploaded
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary">
          Save Settings
        </Button>
      </Box>
    </Container>
  );
}

export default Settings; 