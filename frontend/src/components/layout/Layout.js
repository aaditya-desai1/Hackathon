import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../utils/animations';

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
    <Box sx={{ 
      display: 'flex', 
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
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
          width: { xs: '100%', sm: `calc(100% - ${drawerOpen ? 240 : 56}px)` },
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          mt: '64px', // Height of the header
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ 
              width: '100%', 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default Layout; 
