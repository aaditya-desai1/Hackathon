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
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import { motion } from 'framer-motion';

const drawerWidth = 240;

// Create motion components
const MotionListItem = motion(ListItem);
const MotionListItemIcon = motion(ListItemIcon);
const MotionList = motion(List);

function Sidebar({ drawerOpen, toggleDrawer }) {
  const theme = useTheme();
  const location = useLocation();

  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'File Manager', icon: <DescriptionIcon />, path: '/files' },
    { text: 'Visualizations', icon: <BarChartIcon />, path: '/visualizations' },
    { text: 'Saved Visualizations', icon: <SaveIcon />, path: '/saved-visualizations' },
  ];

  const secondaryMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
    { text: 'About Us', icon: <InfoIcon />, path: '/about' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Simpler animation variants for list items
  const listItemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerOpen ? drawerWidth : 56,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerOpen ? drawerWidth : 56,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          pt: 0,
        },
      }}
      open={drawerOpen}
    >
      <MotionList
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.03
            }
          }
        }}
        sx={{ pt: 0 }}
      >
        {mainMenuItems.map((item, index) => (
          <MotionListItem 
            key={item.text} 
            disablePadding 
            variants={listItemVariants}
            sx={{ display: 'block' }}
          >
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
              <MotionListItemIcon
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
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
              </MotionListItemIcon>
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
          </MotionListItem>
        ))}
      </MotionList>
      <Divider />
      <MotionList
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.03
            }
          }
        }}
      >
        {secondaryMenuItems.map((item, index) => (
          <MotionListItem 
            key={item.text} 
            disablePadding 
            variants={listItemVariants}
            sx={{ display: 'block' }}
          >
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
              <MotionListItemIcon
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
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
              </MotionListItemIcon>
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
          </MotionListItem>
        ))}
      </MotionList>
    </Drawer>
  );
}

export default Sidebar; 
