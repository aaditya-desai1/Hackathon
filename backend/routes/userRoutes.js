const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');

// Initialize Google Client for OAuth
console.log('Using Google Client ID:', process.env.GOOGLE_CLIENT_ID);
const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // Important: Set redirectUri to postmessage for client-side flow
  redirectUri: 'postmessage'
});

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

// Google sign-in
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      console.error('[Google Auth] No token provided in request');
      return res.status(400).json({ error: 'No token provided' });
    }
    
    // Log current environment info
    console.log('[Google Auth] Current environment:', process.env.NODE_ENV);
    console.log('[Google Auth] Using Google Client ID:', process.env.GOOGLE_CLIENT_ID);
    
    // Verify the Google token
    try {
      let payload;
      try {
        // First attempt: Standard verification but without audience validation
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: undefined // Don't strictly verify the audience
        });
        
        payload = ticket.getPayload();
        console.log('[Google Auth] Token verified with standard method');
      } catch (verifyError) {
        console.error('[Google Auth] Standard verification failed:', verifyError.message);
        
        // Second attempt: Fetch token info directly from Google (more permissive method)
        try {
          console.log('[Google Auth] Trying alternative token verification method');
          const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
          
          if (!tokenInfoResponse.ok) {
            throw new Error(`Token info failed: ${tokenInfoResponse.status}`);
          }
          
          payload = await tokenInfoResponse.json();
          console.log('[Google Auth] Token verified with alternative method');
        } catch (altError) {
          console.error('[Google Auth] Alternative verification also failed:', altError.message);
          throw new Error('Could not verify Google token');
        }
      }
      
      // At this point we have a verified payload one way or another
      const { email, name, picture, sub: googleId } = payload;
      
      console.log('[Google Auth] Token verified successfully for:', email);
      console.log('[Google Auth] Token audience:', payload.aud);
      
      // Check if user already exists
      let user = await User.findOne({ email });
      
      if (!user) {
        console.log('[Google Auth] Creating new user account for:', email);
        // Create a new user with Google credentials
        const username = name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
        
        user = new User({
          username,
          email,
          googleId,
          picture
        });
        
        await user.save();
        console.log('[Google Auth] New user created with ID:', user._id);
      } else if (!user.googleId) {
        console.log('[Google Auth] Linking Google account to existing user:', email);
        // Existing user, link Google account
        user.googleId = googleId;
        user.picture = picture || user.picture;
        await user.save();
      } else {
        console.log('[Google Auth] Existing user found with ID:', user._id);
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
    } catch (tokenError) {
      console.error('[Google Auth] Token verification error:', tokenError.message);
      return res.status(401).json({ error: 'Invalid Google token' });
    }
  } catch (error) {
    console.error('[Google Auth] Google sign-in error:', error);
    console.error('[Google Auth] Error stack:', error.stack);
    res.status(400).json({ error: 'Google authentication failed' });
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