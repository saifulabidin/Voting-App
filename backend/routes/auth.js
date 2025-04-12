const express = require('express');
const router = express.Router();
const googleRouter = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Verify reCAPTCHA token
const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

// Register
router.post('/register', async (req, res) => {
  const { username, password, recaptchaToken } = req.body;
  
  // Verify reCAPTCHA first
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return res.status(400).json({ message: 'reCAPTCHA verification failed' });
  }

  // Add input validation
  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Check for existing user case insensitive
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message.includes('Password must contain')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res, next) => {
  const { recaptchaToken } = req.body;
  
  // Verify reCAPTCHA first
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    return res.status(400).json({ message: 'reCAPTCHA verification failed' });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Reset login attempts
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.save();
    }
    
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  })(req, res, next);
});

// Google OAuth routes
googleRouter.get('/', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

googleRouter.get(
  '/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login` 
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${token}`);
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Check session
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = { router, googleRouter };
