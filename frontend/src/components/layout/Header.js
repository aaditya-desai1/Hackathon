import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha } from '@mui/material/styles';
import { useColorMode } from '../../App';

const drawerWidth = 240;

function Header({ drawerOpen, toggleDrawer }) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
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
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(drawerOpen && {
          marginLeft: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
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
            ...(drawerOpen && { display: 'none' }),
          }}
        >
          <MenuIcon />
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

        {/* Search Icon */}
        <Tooltip title="Search">
          <IconButton
            size="large"
            aria-label="search"
            color="inherit"
            sx={{
              mr: 1,
              '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>

        {/* Light/Dark Mode Toggle */}
        <Tooltip title={`Toggle to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
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
        </Tooltip>

        {/* Help */}
        <Tooltip title="Help">
          <IconButton
            size="large"
            aria-label="help"
            color="inherit"
            sx={{
              mr: 1,
              '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
            }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            size="large"
            aria-label="show 4 new notifications"
            aria-controls="notifications-menu"
            aria-haspopup="true"
            onClick={handleNotificationsMenuOpen}
            color="inherit"
            sx={{
              mr: 1,
              '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
            }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profile */}
        <Tooltip title="Account settings">
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{
              '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.05) },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              JS
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}>My account</MenuItem>
        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
        <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        id="notifications-menu"
        anchorEl={notificationsAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
      >
        <MenuItem onClick={handleNotificationsMenuClose}>New file uploaded</MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>Processing complete</MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>
          New visualization available
        </MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>System update</MenuItem>
      </Menu>
    </AppBar>
  );
}

export default Header; 