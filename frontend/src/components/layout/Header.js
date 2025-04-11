import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { alpha } from '@mui/material/styles';
import { useColorMode } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeIn } from '../../utils/animations';

const drawerWidth = 240;

// Create a motion component for MUI components
const MotionAppBar = motion(AppBar);
const MotionIconButton = motion(IconButton);
const MotionButton = motion(Button);
const MotionTypography = motion(Typography);

function Header({ drawerOpen, toggleDrawer }) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MotionAppBar
      position="fixed"
      color="default"
      elevation={0}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: '100%',
        height: 64,
      }}
    >
      <Toolbar sx={{ height: '100%', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MotionIconButton
            edge="start"
            color="inherit"
            aria-label="toggle drawer"
            onClick={toggleDrawer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              mr: 2,
              display: isAuthenticated ? 'flex' : 'none',
            }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </MotionIconButton>
          <MotionTypography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
          >
            DataViz Pro
          </MotionTypography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* User name display when authenticated */}
          {isAuthenticated && currentUser && (
            <MotionTypography
              variant="body2"
              color="inherit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
            >
              Hello, {currentUser.username}
            </MotionTypography>
          )}

          {/* Authentication Button */}
          {isAuthenticated ? (
            <MotionButton
              variant="outlined"
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              size="small"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              sx={{ mr: 2 }}
            >
              Logout
            </MotionButton>
          ) : (
            <MotionButton
              variant="outlined"
              color="inherit"
              onClick={handleLogin}
              startIcon={<LoginIcon />}
              size="small"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              sx={{ mr: 2 }}
            >
              Login
            </MotionButton>
          )}

          {/* Light/Dark Mode Toggle */}
          <MotionIconButton
            size="large"
            aria-label="toggle dark mode"
            onClick={colorMode.toggleColorMode}
            color="inherit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            sx={{
              mr: 0,
              '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </MotionIconButton>
        </Box>
      </Toolbar>
    </MotionAppBar>
  );
}

export default Header; 
