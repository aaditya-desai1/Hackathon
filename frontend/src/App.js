import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, HashRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import Visualizations from './pages/Visualizations';
<<<<<<< HEAD
import SavedVisualizations from './pages/SavedVisualizations';
import Settings from './pages/Settings';
import Help from './pages/Help';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
=======
import Settings from './pages/Settings';
import Help from './pages/Help';
import AboutUs from './pages/AboutUs';
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca

// Create Theme Context
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

<<<<<<< HEAD
// Create Data Context for managing data updates across components
export const DataContext = createContext({
  refreshData: () => {},
  lastUpdate: 0,
});

// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

// Custom hook to use the data context
export const useDataContext = () => useContext(DataContext);

=======
// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
function AppRoutes() {
  const location = useLocation();

  // Log current route for debugging
  useEffect(() => {
    console.log('Current route:', location.pathname);
  }, [location]);

  return (
    <Routes>
<<<<<<< HEAD
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/files" 
        element={
          <ProtectedRoute>
            <FileManager />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/visualizations" 
        element={
          <ProtectedRoute>
            <Visualizations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/saved-visualizations" 
        element={
          <ProtectedRoute>
            <SavedVisualizations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route path="/help" element={<Help />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="*" element={<Navigate to="/landing" replace />} />
=======
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/files" element={<FileManager />} />
      <Route path="/visualizations" element={<Visualizations />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/help" element={<Help />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
    </Routes>
  );
}

function App() {
  // Initialize theme from localStorage or default to 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

<<<<<<< HEAD
  // State for the data context
  const [lastUpdate, setLastUpdate] = useState(Date.now());

=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

<<<<<<< HEAD
  // Add regular polling for data updates
  useEffect(() => {
    // Set up an interval to automatically refresh data every 5 seconds
    const refreshInterval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5000);
    
    // Clean up on unmount
    return () => clearInterval(refreshInterval);
  }, []);

=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

<<<<<<< HEAD
  // Create data context value
  const dataContextValue = useMemo(
    () => ({
      refreshData: () => setLastUpdate(Date.now()),
      lastUpdate,
    }),
    [lastUpdate]
  );

=======
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
  // Create theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        shape: {
          borderRadius: 8,
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
          },
          h2: {
            fontWeight: 500,
          },
          h3: {
            fontWeight: 500,
          },
          h4: {
            fontWeight: 500,
          },
          h5: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
<<<<<<< HEAD
    <AuthProvider>
      <ColorModeContext.Provider value={colorMode}>
        <DataContext.Provider value={dataContextValue}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <HashRouter>
              <Layout>
                <AppRoutes />
              </Layout>
            </HashRouter>
          </ThemeProvider>
        </DataContext.Provider>
      </ColorModeContext.Provider>
    </AuthProvider>
=======
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <Layout>
            <AppRoutes />
          </Layout>
        </HashRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
>>>>>>> 07e877bee730f85c53037e3868e108afba08b8ca
  );
}

export default App; 