const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login error' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.save();
      }
      
      res.json({ 
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          username: user.username
        }
      });
    });
  })(req, res, next);
});

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

module.exports = router;
