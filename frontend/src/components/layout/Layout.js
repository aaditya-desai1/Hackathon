import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if we're on the login or signup page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header drawerOpen={isAuthenticated && drawerOpen} toggleDrawer={toggleDrawer} />
      
      {/* Only render Sidebar if authenticated and not on auth pages */}
      {isAuthenticated && !isAuthPage && (
        <Sidebar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          marginTop: '64px', // Height of the header
          marginLeft: isAuthenticated && !isAuthPage && drawerOpen ? '240px' : '0',
          transition: theme => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 