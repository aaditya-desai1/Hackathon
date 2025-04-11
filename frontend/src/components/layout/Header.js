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

const drawerWidth = 240;

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
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: '100%',
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle drawer"
          onClick={toggleDrawer}
          sx={{
            marginRight: 2,
            display: isAuthenticated ? 'flex' : 'none',
          }}
        >
          {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        <Typography
          component="h1"
          variant="h6"
          color="inherit"
          noWrap
          sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}
        >
          DataViz App
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* User name display when authenticated */}
        {isAuthenticated && currentUser && (
          <Typography
            variant="body2"
            color="inherit"
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
          >
            Hello, {currentUser.username}
          </Typography>
        )}

        {/* Authentication Button */}
        {isAuthenticated ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            size="small"
            sx={{ mr: 2 }}
          >
            Logout
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleLogin}
            startIcon={<LoginIcon />}
            size="small"
            sx={{ mr: 2 }}
          >
            Login
          </Button>
        )}

        {/* Light/Dark Mode Toggle */}
        <IconButton
          size="large"
          aria-label="toggle dark mode"
          onClick={colorMode.toggleColorMode}
          color="inherit"
          sx={{
            mr: 1,
            '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
          }}
        >
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 