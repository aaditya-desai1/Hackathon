const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate auth token
    const token = user.generateAuthToken();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Google Auth Login/Register
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      console.error('Google auth error: No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }
    
    console.log('Google auth: Verifying token with Google');
    console.log('Using Google Client ID:', process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Google auth: Token verified successfully, payload received');
    
    const { email, name, picture, sub: googleId } = payload;
    
    if (!email) {
      console.error('Google auth error: No email in payload');
      return res.status(400).json({ error: 'Email is required from Google authentication' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user with Google credentials
      console.log('Google auth: Creating new user with email', email);
      const username = name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
      
      user = new User({
        username,
        email,
        googleId,
        picture
      });
      
      await user.save();
      console.log('Google auth: New user created successfully');
    } else if (!user.googleId) {
      // Existing user, link Google account
      console.log('Google auth: Linking existing user to Google account');
      user.googleId = googleId;
      user.picture = picture || user.picture;
      await user.save();
    } else {
      console.log('Google auth: Existing user found with Google ID');
    }
    
    // Generate auth token
    const jwtToken = user.generateAuthToken();
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        picture: user.picture
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    // More specific error message for debugging
    res.status(400).json({ 
      error: 'Google authentication failed',
      details: error.message
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['username', 'email', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user account
router.delete('/profile', auth, async (req, res) => {
  try {
    await req.user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 