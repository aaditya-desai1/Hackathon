import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { alpha } from '@mui/material/styles';
import { useColorMode } from '../../App';

const drawerWidth = 240;

function Header({ drawerOpen, toggleDrawer }) {
  const theme = useTheme();
  const colorMode = useColorMode();

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
        width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
        ml: { sm: `${drawerOpen ? drawerWidth : 0}px` },
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