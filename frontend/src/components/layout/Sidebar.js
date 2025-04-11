import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
<<<<<<< HEAD
import SaveIcon from '@mui/icons-material/Save';
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';

const drawerWidth = 240;

function Sidebar({ drawerOpen, toggleDrawer }) {
  const theme = useTheme();
  const location = useLocation();

  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'File Manager', icon: <DescriptionIcon />, path: '/files' },
    { text: 'Visualizations', icon: <BarChartIcon />, path: '/visualizations' },
<<<<<<< HEAD
    { text: 'Saved Visualizations', icon: <SaveIcon />, path: '/saved-visualizations' },
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
  ];

  const secondaryMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'About Us', icon: <InfoIcon />, path: '/about' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      open={drawerOpen}
      sx={{
        width: drawerOpen ? drawerWidth : theme.spacing(7),
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
<<<<<<< HEAD
        zIndex: theme => theme.zIndex.drawer,
        position: 'fixed',
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
        ...(drawerOpen && {
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            overflowX: 'hidden',
<<<<<<< HEAD
            position: 'fixed',
            borderRight: `1px solid ${theme.palette.divider}`,
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
          },
        }),
        ...(!drawerOpen && {
          '& .MuiDrawer-paper': {
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            width: theme.spacing(7),
            boxSizing: 'border-box',
<<<<<<< HEAD
            position: 'fixed',
            borderRight: `1px solid ${theme.palette.divider}`,
=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
          },
        }),
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'flex-end' : 'center',
          px: [1],
        }}
      >
        {drawerOpen && (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, fontWeight: 'bold' }}
            >
              DataViz Pro
            </Typography>
<<<<<<< HEAD
=======
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                borderLeft: isActive(item.path)
                  ? `4px solid ${theme.palette.primary.main}`
                  : '4px solid transparent',
                backgroundColor: isActive(item.path)
                  ? `${theme.palette.primary.main}10`
                  : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 2 : 'auto',
                  justifyContent: 'center',
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: drawerOpen ? 1 : 0,
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {secondaryMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                borderLeft: isActive(item.path)
                  ? `4px solid ${theme.palette.primary.main}`
                  : '4px solid transparent',
                backgroundColor: isActive(item.path)
                  ? `${theme.palette.primary.main}10`
                  : 'transparent',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 2 : 'auto',
                  justifyContent: 'center',
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: drawerOpen ? 1 : 0,
                  color: isActive(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar; 