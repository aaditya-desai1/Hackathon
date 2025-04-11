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

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!username) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    
    if (!email) errors.email = 'Email is required';
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    console.log('Attempting to register user:', { username, email, password });
    const success = await register(username, email, password);
    
    if (success) {
      console.log('Registration successful, navigating to dashboard');
      navigate('/dashboard');
    } else {
      console.error('Registration failed');
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
            Create an Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {error}
              </Typography>
              
              {/* Provide helpful suggestions based on common error types */}
              {error.toLowerCase().includes('email') && error.toLowerCase().includes('exist') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • This email address is already registered
                  </Typography>
                  <Typography variant="body2">
                    • Try signing in with this email instead
                  </Typography>
                  <Typography variant="body2">
                    • Use a different email address to create a new account
                  </Typography>
                </Box>
              )}
              
              {error.toLowerCase().includes('username') && error.toLowerCase().includes('exist') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • This username is already taken
                  </Typography>
                  <Typography variant="body2">
                    • Try a different username
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
              {!error.toLowerCase().includes('email') && 
               !error.toLowerCase().includes('username') && 
               !error.toLowerCase().includes('network') && 
               !error.toLowerCase().includes('server') && (
                <Box component="div" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    • Make sure all fields are filled out correctly
                  </Typography>
                  <Typography variant="body2">
                    • If you already have an account, try signing in instead
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
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!formErrors.username}
              helperText={formErrors.username}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            
            {/* Google Login Button */}
            <GoogleLoginButton />
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup; 