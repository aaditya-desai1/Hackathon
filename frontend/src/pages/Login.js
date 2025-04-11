import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Alert, 
  Paper,
  Link,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    console.log('Attempting to login with:', { email });
    const success = await login(email, password);
    
    if (success) {
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } else {
      console.error('Login failed');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {error}
              </Typography>
              
              {/* Provide helpful suggestions based on common error types */}
              {error.toLowerCase().includes('invalid credentials') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • Make sure your email and password are correct
                  </Typography>
                  <Typography variant="body2">
                    • Check if caps lock is turned on
                  </Typography>
                  <Typography variant="body2">
                    • If you just registered, try using those exact credentials
                  </Typography>
                </Box>
              )}
              
              {error.toLowerCase().includes('network') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • Check your internet connection
                  </Typography>
                  <Typography variant="body2">
                    • The server might be temporarily down
                  </Typography>
                  <Typography variant="body2">
                    • Try again in a few minutes
                  </Typography>
                </Box>
              )}
              
              {error.toLowerCase().includes('server') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • The server might be experiencing issues
                  </Typography>
                  <Typography variant="body2">
                    • Please try again later
                  </Typography>
                </Box>
              )}
              
              {/* General suggestion for other errors */}
              {!error.toLowerCase().includes('invalid credentials') && 
               !error.toLowerCase().includes('network') &&
               !error.toLowerCase().includes('server') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • If you don't have an account yet, please sign up
                  </Typography>
                  <Typography variant="body2">
                    • If you forgot your password, contact the administrator
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            {/* Google Login Button */}
            <GoogleLoginButton />
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" variant="body2">
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 