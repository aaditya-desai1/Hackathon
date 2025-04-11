<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

function Layout({ children }) {
  // Initialize drawer state from localStorage or default to open
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if we're on the login or signup page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const toggleDrawer = () => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    // Save to localStorage whenever state changes
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  // Save drawer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(drawerOpen));
  }, [drawerOpen]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header drawerOpen={isAuthenticated && drawerOpen} toggleDrawer={toggleDrawer} />
      
      {/* Only render Sidebar if authenticated and not on auth pages */}
      {isAuthenticated && !isAuthPage && (
        <Sidebar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
      )}
      
=======
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
      <Sidebar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          marginTop: '64px', // Height of the header
<<<<<<< HEAD
          marginLeft: isAuthenticated && !isAuthPage && drawerOpen ? '240px' : (isAuthenticated && !isAuthPage ? theme => theme.spacing(7) : 0),
          transition: theme => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 