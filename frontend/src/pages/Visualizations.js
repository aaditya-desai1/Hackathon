import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper,
  Grid
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import BarChartIcon from '@mui/icons-material/BarChart';
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/animations';
import { useDataContext } from '../contexts/DataContext';

function Visualizations() {
  const { currentData } = useDataContext();
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Check if we have data loaded
    setHasData(currentData && Object.keys(currentData).length > 0);
  }, [currentData]);

  return (
    <Container maxWidth="xl">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <PageHeader 
          title="Data Visualizations" 
          icon={<BarChartIcon fontSize="large" color="primary" />} 
        />

        <Box sx={{ mt: 4 }}>
          {!hasData ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                No visualizations yet
              </Typography>
              <Typography variant="body1" paragraph>
                Create your first visualization by uploading a file. We'll
                automatically recommend the best charts for your data.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                href="/files"
              >
                Upload Data
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Visualization Tips
                  </Typography>
                  <Typography variant="body2">
                    • Choose the right chart type for your data<br />
                    • Keep your visualizations simple and focused<br />
                    • Use color effectively to highlight important data<br />
                    • Label your axes and include a clear title
                  </Typography>
                </Paper>
              </Grid>
              {/* Visualization content will go here */}
            </Grid>
          )}
        </Box>
      </motion.div>
    </Container>
  );
}

export default Visualizations; 